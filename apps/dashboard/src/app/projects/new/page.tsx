"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createProject, PROJECT_TYPES, type ProjectType } from "@/lib/api";
import { INITIAL_WIZARD, TYPE_LABELS, canAdvance, wizardToInput } from "@/lib/projects";

const STEPS = ["Name", "Type", "Description", "Confirm"];

export default function NewProjectPage() {
  const router = useRouter();
  const [state, setState] = useState(INITIAL_WIZARD);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = (): void => setState((s) => ({ ...s, step: Math.min(s.step + 1, 4) }));
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New project</h1>
        <p className="text-sm text-muted-foreground">
          Step {state.step} of 4 — {STEPS[state.step - 1]}
        </p>
      </div>

      <div className="flex gap-2">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`h-1.5 flex-1 rounded-full ${i < state.step ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[state.step - 1]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.step === 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Project name</label>
              <Input
                autoFocus
                placeholder="e.g. TGMAX News Portal"
                value={state.name}
                onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
              />
            </div>
          )}

          {state.step === 2 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {PROJECT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setState((s) => ({ ...s, type: t as ProjectType }))}
                  className={`rounded-md border p-4 text-left text-sm transition-colors ${
                    state.type === t
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <span className="font-medium">{TYPE_LABELS[t]}</span>
                </button>
              ))}
            </div>
          )}

          {state.step === 3 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optional)</label>
              <Textarea
                placeholder="What is this project about?"
                value={state.description}
                onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))}
              />
            </div>
          )}

          {state.step === 4 && (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-border py-2">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium">{state.name}</dd>
              </div>
              <div className="flex justify-between border-b border-border py-2">
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-medium">{state.type ? TYPE_LABELS[state.type] : "—"}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-muted-foreground">Description</dt>
                <dd className="max-w-xs text-right">{state.description || "—"}</dd>
              </div>
            </dl>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={back} disabled={state.step === 1 || saving}>
              Back
            </Button>
            {state.step < 4 ? (
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
