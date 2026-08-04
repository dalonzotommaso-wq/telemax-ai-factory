"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  getProject,
  updateProject,
  PROJECT_STATUSES,
  PROJECT_TYPES,
  type Project,
  type ProjectStatus,
  type ProjectType,
} from "@/lib/api";
import { TYPE_LABELS } from "@/lib/projects";

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [project, setProject] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setProject(await getProject(id));
      } catch {
        setError("Could not load the project.");
      }
    })();
  }, [id]);

  const save = async (): Promise<void> => {
    if (!project) return;
    setSaving(true);
    setError(null);
    try {
      await updateProject(id, {
        name: project.name,
        type: project.type,
        description: project.description,
        status: project.status,
        version: project.version,
      });
      router.push("/projects");
    } catch {
      setError("Could not save changes.");
      setSaving(false);
    }
  };

  if (error && !project) return <p className="text-sm text-red-600">{error}</p>;
  if (!project) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Edit project</h1>
      <Card>
        <CardHeader>
          <CardTitle>{project.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={project.name}
              onChange={(e) => setProject({ ...project, name: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={project.type}
                onChange={(e) => setProject({ ...project, type: e.target.value as ProjectType })}
              >
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={project.status}
                onChange={(e) =>
                  setProject({ ...project, status: e.target.value as ProjectStatus })
                }
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Version</label>
            <Input
              value={project.version}
              onChange={(e) => setProject({ ...project, version: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={project.description}
              onChange={(e) => setProject({ ...project, description: e.target.value })}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => router.push("/projects")}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
