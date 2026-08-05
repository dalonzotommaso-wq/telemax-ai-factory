"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createProject,
  fetchSystemStatus,
  PROJECT_TYPES,
  type ProjectType,
  type SystemStatus,
} from "@/lib/api";
import {
  INITIAL_WIZARD,
  TYPE_LABELS,
  WIZARD_STEPS,
  canAdvance,
  wizardToInput,
} from "@/lib/projects";

function Choice({
  active,
  onClick,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border p-4 text-left text-sm transition-colors ${
        active ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
      }`}
    >
      <span className="font-medium">{title}</span>
      {subtitle && <span className="mt-0.5 block text-xs text-muted-foreground">{subtitle}</span>}
    </button>
  );
}

export default function NewProjectPage() {
  const router = useRouter();
  const [state, setState] = useState(INITIAL_WIZARD);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        setStatus(await fetchSystemStatus(controller.signal));
      } catch {
        /* status stays null; steps show an empty-state message */
      }
    })();
    return () => controller.abort();
  }, []);

  const next = (): void => setState((s) => ({ ...s, step: Math.min(s.step + 1, 6) }));
  const back = (): void => setState((s) => ({ ...s, step: Math.max(s.step - 1, 1) }));

  const submit = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      const created = await createProject(wizardToInput(state));
      router.push(`/projects?created=${created.id}`);
    } catch {
      setError("Could not create the project. Is the API running on port 3001?");
      setSaving(false);
    }
  };

  const generators = status?.generators ?? [];
  const knowledgePacks = status?.knowledgePacks ?? [];
  const providers = status?.aiProviders ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New project</h1>
        <p className="text-sm text-muted-foreground">
          Step {state.step} of 6 — {WIZARD_STEPS[state.step - 1]}
        </p>
      </div>

      <div className="flex gap-2">
        {WIZARD_STEPS.map((label, i) => (
          <div
            key={label}
            className={`h-1.5 flex-1 rounded-full ${i < state.step ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{WIZARD_STEPS[state.step - 1]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project name</label>
                <Input
                  autoFocus
                  placeholder="e.g. TGMAX News Portal"
                  value={state.name}
                  onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Client</label>
                <Input
                  placeholder="e.g. Gruppo AIR"
                  value={state.client}
                  onChange={(e) => setState((s) => ({ ...s, client: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="What is this project about?"
                  value={state.description}
                  onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))}
                />
              </div>
            </div>
          )}

          {state.step === 2 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {PROJECT_TYPES.map((t) => (
                <Choice
                  key={t}
                  active={state.type === t}
                  onClick={() => setState((s) => ({ ...s, type: t as ProjectType }))}
                  title={TYPE_LABELS[t]}
                />
              ))}
            </div>
          )}

          {state.step === 3 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {generators.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No generators detected. Is the API running?
                </p>
              )}
              {generators.map((g) => (
                <Choice
                  key={g.name}
                  active={state.generator === g.name}
                  onClick={() => setState((s) => ({ ...s, generator: g.name }))}
                  title={g.name}
                  subtitle={`v${g.version}`}
                />
              ))}
            </div>
          )}

          {state.step === 4 && (
            <div className="grid gap-2 sm:grid-cols-2">
              <Choice
                active={state.knowledgePack === ""}
                onClick={() => setState((s) => ({ ...s, knowledgePack: "" }))}
                title="None"
              />
              {knowledgePacks.map((k) => (
                <Choice
                  key={k.name}
                  active={state.knowledgePack === k.name}
                  onClick={() => setState((s) => ({ ...s, knowledgePack: k.name }))}
                  title={k.name}
                />
              ))}
            </div>
          )}

          {state.step === 5 && (
            <div className="grid gap-2 sm:grid-cols-2">
              <Choice
                active={state.aiProvider === ""}
                onClick={() => setState((s) => ({ ...s, aiProvider: "" }))}
                title="None"
              />
              {providers.map((p) => (
                <Choice
                  key={p.name}
                  active={state.aiProvider === p.name}
                  onClick={() => setState((s) => ({ ...s, aiProvider: p.name }))}
                  title={p.name}
                  subtitle={p.implemented ? "ready" : "stub"}
                />
              ))}
            </div>
          )}

          {state.step === 6 && (
            <dl className="space-y-1 text-sm">
              {[
                ["Name", state.name],
                ["Client", state.client || "—"],
                ["Type", state.type ? TYPE_LABELS[state.type] : "—"],
                ["Generator", state.generator || "—"],
                ["Knowledge Pack", state.knowledgePack || "—"],
                ["AI Provider", state.aiProvider || "—"],
                ["Description", state.description || "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-border py-2 last:border-0">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="max-w-xs text-right font-medium">{v}</dd>
                </div>
              ))}
              <p className="pt-2 text-xs text-muted-foreground">
                On confirm the project is saved to the database and a real workspace folder
                (with project.json) is created on disk.
              </p>
            </dl>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={back} disabled={state.step === 1 || saving}>
              Back
            </Button>
            {state.step < 6 ? (
              <Button onClick={next} disabled={!canAdvance(state)}>
                Continue
              </Button>
            ) : (
              <Button onClick={() => void submit()} disabled={saving}>
                {saving ? "Saving…" : "Create project"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
