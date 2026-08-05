"use client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { fetchHealth } from "@/lib/api";

type Status = "loading" | "online" | "offline";

export function ApiStatus() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const check = async (): Promise<void> => {
      try {
        await fetchHealth(controller.signal);
        if (active) setStatus("online");
      } catch {
        if (active) setStatus("offline");
      }
    };
    void check();
    const timer = setInterval(() => void check(), 10000);
    return () => {
      active = false;
      controller.abort();
      clearInterval(timer);
    };
  }, []);

  if (status === "loading") return <Badge variant="muted">API: …</Badge>;
  return (
    <Badge variant={status === "online" ? "online" : "offline"}>
      API: {status === "online" ? "ONLINE" : "OFFLINE"}
    </Badge>
  );
}
