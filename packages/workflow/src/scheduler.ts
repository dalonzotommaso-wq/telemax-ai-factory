/**
 * {@link WorkflowScheduler} — an in-memory schedule store. One-shot `runAt`
 * entries are supported and surfaced by {@link due}; cron and distributed
 * scheduling are prepared (the `cron` field is stored but not triggered here).
 */
import type { ScheduleEntry } from "./domain/schedule.js";

export class WorkflowScheduler {
  private readonly entries = new Map<string, ScheduleEntry>();

  public schedule(entry: ScheduleEntry): void {
    this.entries.set(entry.id, entry);
  }

  public get(id: string): ScheduleEntry | undefined {
    return this.entries.get(id);
  }

  public remove(id: string): void {
    this.entries.delete(id);
  }

  public list(): readonly ScheduleEntry[] {
    return [...this.entries.values()];
  }

  /** Entries whose one-shot `runAt` is at or before `nowIso`. */
  public due(nowIso: string): readonly ScheduleEntry[] {
    return [...this.entries.values()].filter(
      (entry) => entry.runAt !== undefined && entry.runAt <= nowIso,
    );
  }
}
