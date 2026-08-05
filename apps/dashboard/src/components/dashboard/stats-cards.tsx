"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchStats, type Stats } from "@/lib/api";

const LABELS: { key: keyof Stats; label: string; hint: string }[] = [
  { key: "projects", label: "Projects", hint: "live from database" },
  { key: "generators", label: "Generators", hint: "WordPress News v1" },
  { key: "packages", label: "Engine packages", hint: "@telemax/*" },
  { key: "tests", label: "Tests", hint: "monorepo suite" },
];

export function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        setStats(await fetchStats(controller.signal));
      } catch {
        setError(true);
      }
    })();
    return () => controller.abort();
  }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {LABELS.map((s) => (
        <Card key={s.key}>
          <CardHeader className="pb-2">
            <CardDescription>{s.label}</CardDescription>
            <CardTitle className="text-3xl">{stats ? stats[s.key] : error ? "—" : "…"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{s.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
