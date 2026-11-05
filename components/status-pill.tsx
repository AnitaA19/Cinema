import { cn } from "cn"
import { sessionStatusName } from "@/lib/format"
import type { SessionStatus } from "@/lib/types"

export function StatusPill({ value }: { value: string | SessionStatus }) {
  const label = typeof value === "string" && !["1", "2", "3"].includes(value) ? value : sessionStatusName(value)
  const tone =
    label === "Active" || label === "Scheduled"
      ? "bg-primary/15 text-primary"
      : label === "Cancelled"
        ? "bg-destructive/15 text-destructive"
        : "bg-muted text-muted-foreground"
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", tone)}>{label}</span>
}
