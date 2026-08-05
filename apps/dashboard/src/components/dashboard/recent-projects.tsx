"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/projects/status-badge";
import { listProjects, type Project } from "@/lib/api";
import { TYPE_LABELS } from "@/lib/projects";

export function RecentProjects() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        // Live from the database, most-recently updated first.
        const all = await listProjects({ sort: "updatedAt", order: "desc" });
        setProjects(all.slice(0, 5));
      } catch {
        setError(true);
      }
    })();
    return () => controller.abort();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent projects</CardTitle>
        <CardDescription>Latest activity, read live from the database.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-muted-foreground">Could not reach the API.</p>}
        {!error && projects === null && (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}
        {projects !== null && projects.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No projects yet.{" "}
            <Link href="/projects/new" className="underline">
              Create your first project
            </Link>
            .
          </p>
        )}
        {projects && projects.length > 0 && (
          <div className="space-y-3">
            {projects.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-1 border-b border-border pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-center justify-between">
                  <Link href={`/projects/${p.id}/edit`} className="font-medium hover:underline">
                    {p.name}
                  </Link>
                  <StatusBadge status={p.status} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Updated {new Date(p.updatedAt).toLocaleString()}</span>
                  <span>Type: {TYPE_LABELS[p.type]}</span>
                  <span>Generator: {p.generator || "—"}</span>
                  <span>Workflow: {p.workflow || "—"}</span>
                  <span>AI: {p.aiProvider || "—"}</span>
                  <span>
                    Workspace: <code>{p.workspace || "—"}</code>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
