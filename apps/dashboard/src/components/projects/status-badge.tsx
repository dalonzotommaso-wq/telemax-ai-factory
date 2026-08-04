import { Badge } from "@/components/ui/badge";
import type { ProjectStatus } from "@/lib/api";

const MAP: Record<ProjectStatus, "online" | "default" | "muted"> = {
  active: "online",
  draft: "muted",
  archived: "default",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge variant={MAP[status]}>{status}</Badge>;
}
