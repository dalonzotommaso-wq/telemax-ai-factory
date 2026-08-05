"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Pencil, Plus, RefreshCw, Copy, Archive, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/projects/status-badge";
import {
  archiveProject,
  deleteProject,
  duplicateProject,
  generateProject,
  listProjects,
  type Project,
} from "@/lib/api";
import { TYPE_LABELS, filterAndSortProjects, type SortField } from "@/lib/projects";

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortField>("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      setProjects(await listProjects());
    } catch {
      setError("Could not reach the API. Is it running on port 3001?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(
    () => filterAndSortProjects(projects, q, sort, order),
    [projects, q, sort, order],
  );

  const onDelete = async (id: number): Promise<void> => {
    if (!confirm("Delete this project?")) return;
    await deleteProject(id);
    await load();
  };

  const onArchive = async (id: number): Promise<void> => {
    await archiveProject(id);
    await load();
  };

  const onDuplicate = async (id: number): Promise<void> => {
    await duplicateProject(id);
    await load();
  };

  const onGenerate = async (id: number): Promise<void> => {
    setGeneratingId(id);
    try {
      await generateProject(id);
      router.push(`/projects/${id}/generation`);
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Create and manage your projects.</p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="h-4 w-4" /> New project
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by name or description…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortField)}
          className="max-w-[160px]"
        >
          <option value="createdAt">Sort: Created</option>
          <option value="name">Sort: Name</option>
          <option value="status">Sort: Status</option>
          <option value="type">Sort: Type</option>
        </Select>
        <Select
          value={order}
          onChange={(e) => setOrder(e.target.value as "asc" | "desc")}
          className="max-w-[130px]"
        >
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </Select>
        <Button variant="outline" size="icon" onClick={() => void load()} aria-label="Refresh">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="p-4 text-sm text-red-600">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No projects yet. Click <span className="font-medium">New project</span> to create one.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Generator</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.client || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{TYPE_LABELS[p.type]}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.generator || "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          disabled={generatingId === p.id}
                          onClick={() => void onGenerate(p.id)}
                        >
                          <Sparkles className="h-4 w-4" />
                          {generatingId === p.id ? "Generating…" : "Genera"}
                        </Button>
                        <Link href={`/projects/${p.id}/edit`}>
                          <Button variant="ghost" size="icon" aria-label="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Duplicate"
                          onClick={() => void onDuplicate(p.id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Archive"
                          onClick={() => void onArchive(p.id)}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete"
                          onClick={() => void onDelete(p.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
