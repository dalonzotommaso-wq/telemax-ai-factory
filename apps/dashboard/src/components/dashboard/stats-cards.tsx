"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchSystemStatus, type SystemStatus } from "@/lib/api";

const CARDS: { key: keyof SystemStatus["counts"]; label: string; hint: string }[] = [
  { key: "packages", label: "Packages", hint: "@telemax/* workspaces" },
  { key: "apps", label: "Applications", hint: "runnable apps/*" },
  { key: "tests", label: "Tests", hint: "monorepo suite" },
  { key: "endpoints", label: "Endpoints", hint: "live API routes" },
];

export function StatsCards() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        setStatus(await fetchSystemStatus(controller.signal));
      } catch {
        setError(true);
      }
    })();
    return () => controller.abort();
  }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map((c) => (
        <Card key={c.key}>
          <CardHeader className="pb-2">
            <CardDescription>{c.label}</CardDescription>
            <CardTitle className="text-3xl">
              {status ? status.counts[c.key] : error ? "—" : "…"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{c.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
