import { StatsCards } from "@/components/dashboard/stats-cards";
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

      <Card>
        <CardHeader>
          <CardTitle>Platform status</CardTitle>
          <CardDescription>
            The stats above are read live from the API/database. The badge in the top bar performs a
            live <code>GET /health</code> and shows ONLINE or OFFLINE.
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
