import { cn } from "cn"

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-heading text-lg tracking-tight text-foreground", className)}>
      <span className="relative grid size-7 place-items-center">
        <span className="absolute inset-0 rounded-full border border-primary/70" />
        <span className="absolute inset-1 rounded-full border border-primary/35" />
        <span className="size-2 rounded-full bg-primary" />
      </span>
      CinemaGo
    </span>
  )
}
