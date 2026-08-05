"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchSystemStatus, type SystemStatus } from "@/lib/api";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function buildBadge(status: SystemStatus["build"]["status"]) {
  if (status === "built") return <Badge variant="online">BUILT</Badge>;
  if (status === "partial") return <Badge variant="muted">PARTIAL</Badge>;
  return <Badge variant="offline">NOT BUILT</Badge>;
}

export default function SystemPage() {
  const [data, setData] = useState<SystemStatus | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        setData(await fetchSystemStatus(controller.signal));
      } catch {
        setError(true);
      }
    })();
    return () => controller.abort();
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">System</h1>
        <Card>
          <CardHeader>
            <CardTitle>API unreachable</CardTitle>
            <CardDescription>
              Could not read the platform status. Start the API and reload.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">System</h1>
        <p className="text-sm text-muted-foreground">Scanning the repository…</p>
      </div>
    );
  }

  const { repository, counts, build, git } = data;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">System</h1>
        <p className="text-sm text-muted-foreground">
          Live control plane. Every value below is read from the repository and git at request
          time — no static data.
        </p>
      </div>

      {/* Summary counters */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Packages" value={counts.packages} />
        <Stat label="Applications" value={counts.apps} />
        <Stat label="Generators" value={counts.generators} />
        <Stat label="Tests" value={counts.tests} />
        <Stat label="Endpoints" value={counts.endpoints} />
      </div>

      {/* Repository + Git */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Repository</CardTitle>
            <CardDescription>{repository.description || repository.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <code>{repository.name}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <code>{repository.version}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Branch</span>
              <code>{git.branch ?? "—"}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Turbo tasks</span>
              <span>{repository.turboTasks.join(", ") || "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Git</CardTitle>
            <CardDescription>Last commit, tag and pending changesets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Last commit</span>
              <span className="truncate text-right">
                <code>{git.lastCommitShort ?? "—"}</code>{" "}
                {git.lastCommitSubject ? `· ${git.lastCommitSubject}` : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span>{git.lastCommitDate?.slice(0, 10) ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last tag</span>
              <code>{git.lastTag ?? "—"}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Working tree</span>
              {git.dirty ? (
                <Badge variant="muted">dirty</Badge>
              ) : (
                <Badge variant="online">clean</Badge>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Commits · changesets</span>
              <span>
                {git.totalCommits ?? "—"} · {git.pendingChangesets}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Build */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Last build</CardTitle>
            <CardDescription>{build.note}</CardDescription>
          </div>
          {buildBadge(build.status)}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {build.workspacesBuilt} / {build.workspacesTotal} workspaces have build artifacts.
          </p>
        </CardContent>
      </Card>

      {/* Packages */}
      <Card>
        <CardHeader>
          <CardTitle>Installed packages ({data.packages.length})</CardTitle>
          <CardDescription>Workspace libraries under core/, config/ and packages/</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.packages.map((p) => (
            <div
              key={p.name}
              className="flex flex-col gap-1 border-b border-border pb-2 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <code className="text-sm">{p.name}</code>{" "}
                <span className="text-xs text-muted-foreground">v{p.version}</span>
                {p.internalDependencies.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    → {p.internalDependencies.join(", ")}
                  </div>
                )}
              </div>
              <Badge variant={p.built ? "online" : "muted"}>{p.state}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Applications */}
      <Card>
        <CardHeader>
          <CardTitle>Applications ({data.apps.length})</CardTitle>
          <CardDescription>Runnable apps under apps/</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.apps.map((a) => (
            <div
              key={a.name}
              className="flex flex-col gap-1 border-b border-border pb-2 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <code className="text-sm">{a.name}</code>{" "}
                <span className="text-xs text-muted-foreground">v{a.version}</span>
                <div className="text-xs text-muted-foreground">{a.stack.join(", ")}</div>
              </div>
              <Badge variant={a.built ? "online" : "muted"}>{a.built ? "built" : "source"}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Generators / Knowledge / Workflow / Providers */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Generators</CardTitle>
            <CardDescription>Available generator packages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {data.generators.length === 0 && <span className="text-muted-foreground">None</span>}
            {data.generators.map((g) => (
              <div key={g.name} className="flex justify-between">
                <code>{g.name}</code>
                <span className="text-xs text-muted-foreground">v{g.version}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Providers</CardTitle>
            <CardDescription>Registered providers in @telemax/ai</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.aiProviders.length === 0 && <span className="text-muted-foreground">None</span>}
            {data.aiProviders.map((p) => (
              <Badge key={p.name} variant={p.implemented ? "online" : "muted"}>
                {p.name}
                {p.implemented ? "" : " (stub)"}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Knowledge Packs</CardTitle>
            <CardDescription>Knowledge engine and packs</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.knowledgePacks.length === 0 && <span className="text-muted-foreground">None</span>}
            {data.knowledgePacks.map((k) => (
              <Badge key={k.name} variant="muted">
                {k.name}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow</CardTitle>
            <CardDescription>Workflow engine</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            {data.workflow ? (
              <div className="flex justify-between">
                <code>{data.workflow.package}</code>
                <span className="text-xs text-muted-foreground">v{data.workflow.version}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">Not present</span>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Scanned at {new Date(data.scannedAt).toLocaleString()}.
      </p>
    </div>
  );
}
