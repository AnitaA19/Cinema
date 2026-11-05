import { AlertCircle, Film } from "lucide-react"
import { Button } from "@/components/ui/button"
import { errorText } from "@/lib/api"

export function LoadingBlock({ label = "Loading the programme" }: { label?: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label={label}>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-border/70 bg-card/60">
          <div className="aspect-[2/3] animate-pulse bg-muted" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ErrorBlock({
  error,
  onRetry,
}: {
  error: unknown
  onRetry?: () => void
}) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-5 py-8 text-center">
      <AlertCircle className="mx-auto size-6 text-destructive" />
      <p className="mt-3 font-medium">CinemaGo could not complete that</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{errorText(error)}</p>
      {onRetry ? (
        <Button className="mt-4 h-10 px-4" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}

export function EmptyBlock({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-5 py-12 text-center">
      <Film className="mx-auto size-6 text-primary" />
      <p className="mt-3 font-heading text-xl">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
