import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { API_URL } from "@/lib/api";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Telemax AI Factory</h1>
        <p className="text-sm text-muted-foreground">
          Control plane overview. API base URL: <code>{API_URL}</code>
        </p>
      </div>

      <StatsCards />

      <RecentProjects />

      <Card>
        <CardHeader>
          <CardTitle>Platform status</CardTitle>
          <CardDescription>
            The cards above are read live from <code>GET /system/status</code> and the projects list
            from <code>GET /projects</code> — no static data. See the{" "}
            <a className="underline" href="/system">
              System
            </a>{" "}
            page for the full breakdown.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Start the full stack with <code>pnpm dev</code> and open{" "}
            <code>http://localhost:3000</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
