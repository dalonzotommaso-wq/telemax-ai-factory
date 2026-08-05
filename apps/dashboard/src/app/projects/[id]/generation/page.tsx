"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  fetchGeneration,
  fetchGenerationLogs,
  generateProject,
  type Generation,
  type GenerationLog,
} from "@/lib/api";

const PHASES: { key: string; label: string }[] = [
  { key: "preparation", label: "Preparazione" },
  { key: "knowledge", label: "Knowledge" },
  { key: "workflow", label: "Workflow" },
  { key: "ai", label: "AI" },
  { key: "generator", label: "Generator" },
  { key: "writing", label: "Scrittura" },
  { key: "completed", label: "Completato" },
];

function bytes(n: number): string {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(1)} KB`;
}

export default function GenerationDetailsPage() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const [gen, setGen] = useState<Generation | null>(null);
  const [logs, setLogs] = useState<GenerationLog[]>([]);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const refresh = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      const [g, l] = await Promise.all([
        fetchGeneration(projectId, signal),
        fetchGenerationLogs(projectId, signal),
      ]);
      setGen(g);
      setLogs(l);
    },
    [projectId],
  );

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    // Auto-update while a generation is running.
    const timer = setInterval(() => {
      setGen((current) => {
        if (current && current.status !== "running") return current;
        void refresh(controller.signal);
        return current;
      });
    }, 800);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [refresh]);

  const regenerate = async (): Promise<void> => {
    setRegenerating(true);
    try {
      await generateProject(projectId);
      await refresh();
    } finally {
      setRegenerating(false);
    }
  };

  const copy = async (label: string, value: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const reached = new Set(logs.map((l) => l.phase));
  const workspaceDir = gen ? gen.outputDir.replace(/\/output$/, "") : "";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Generation details</h1>
          <p className="text-sm text-muted-foreground">
            Project #{projectId} ·{" "}
            <Link href="/projects" className="underline">
              back to projects
            </Link>
          </p>
        </div>
        {gen && (
          <Badge
            variant={
              gen.status === "completed" ? "online" : gen.status === "failed" ? "offline" : "muted"
            }
          >
            {gen.status.toUpperCase()}
          </Badge>
        )}
      </div>

      {gen === null && (
        <Card>
          <CardHeader>
            <CardTitle>No generation yet</CardTitle>
            <CardDescription>Run the generator from the Projects page first.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {gen && (
        <>
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
              <CardDescription>
                {gen.generator || "generator"} ·{" "}
                {gen.durationMs !== null ? `${gen.durationMs} ms` : "running…"} · {gen.fileCount}{" "}
                files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {PHASES.map((phase) => {
                  const done = reached.has(phase.key) || (phase.key === "completed" && gen.status === "completed");
                  const active = gen.status === "running" && !done;
                  return (
                    <li key={phase.key} className="flex items-center gap-3 text-sm">
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                          done
                            ? "bg-emerald-500 text-white"
                            : active
                              ? "bg-amber-400 text-white"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {done ? "✓" : active ? "…" : ""}
                      </span>
                      <span className={done ? "font-medium" : "text-muted-foreground"}>
                        {phase.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>

          {/* Errors */}
          {gen.error && (
            <Card>
              <CardHeader>
                <CardTitle>Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap rounded-md bg-red-50 p-3 text-sm text-red-700">
                  {gen.error}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Output paths + actions (FASE 12) */}
          <Card>
            <CardHeader>
              <CardTitle>Output</CardTitle>
              <CardDescription>Generated into the project workspace on disk.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Workspace</span>
                  <code className="truncate">{workspaceDir || "—"}</code>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Output</span>
                  <code className="truncate">{gen.outputDir || "—"}</code>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => void copy("workspace", workspaceDir)}>
                  Apri Workspace
                </Button>
                <Button variant="outline" size="sm" onClick={() => void copy("output", gen.outputDir)}>
                  Apri Output
                </Button>
                <Button variant="outline" size="sm" onClick={() => void copy("folder", workspaceDir)}>
                  Apri Cartella
                </Button>
                <Button size="sm" disabled={regenerating} onClick={() => void regenerate()}>
                  {regenerating ? "Regenerating…" : "Rigenera"}
                </Button>
                {copied && (
                  <span className="self-center text-xs text-muted-foreground">
                    {copied} path copied
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Produced files */}
          <Card>
            <CardHeader>
              <CardTitle>Produced files ({gen.files?.length ?? 0})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-80 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 border-b border-border bg-background text-left text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 font-medium">Path</th>
                      <th className="px-4 py-2 font-medium">Size</th>
                      <th className="px-4 py-2 font-medium">SHA-256</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(gen.files ?? []).map((f) => (
                      <tr key={f.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-2">{f.path}</td>
                        <td className="px-4 py-2 text-muted-foreground">{bytes(f.bytes)}</td>
                        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                          {f.sha256.slice(0, 12)}…
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Log */}
          <Card>
            <CardHeader>
              <CardTitle>Log</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-72 overflow-auto p-4 font-mono text-xs">
                {logs.map((l) => (
                  <div key={l.id} className={l.level === "error" ? "text-red-600" : ""}>
                    <span className="text-muted-foreground">{new Date(l.ts).toLocaleTimeString()}</span>{" "}
                    <span className="font-semibold">[{l.phase}]</span> {l.message}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
