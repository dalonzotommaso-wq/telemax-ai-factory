import { ApiStatus } from "@/components/layout/api-status";
import { Button } from "@/components/ui/button";

export function Topbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <div className="text-sm text-muted-foreground">Control Plane</div>
      <div className="flex items-center gap-3">
        <ApiStatus />
        <Button variant="outline" size="sm">
          Sign out
        </Button>
      </div>
    </header>
  );
}
