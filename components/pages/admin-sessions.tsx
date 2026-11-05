"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { cinema, errorText } from "@/lib/api"
import { formatMoney, formatWhen, tbilisiDayKey, tbilisiLocalToUtcIso, utcToTbilisiInput } from "@/lib/format"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { DateTimePicker } from "@/components/date-time-picker"
import { StatusPill } from "@/components/status-pill"
import { ErrorBlock, EmptyBlock } from "@/components/states"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Session, SessionInput } from "@/lib/types"

export function AdminSessions() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [movieId, setMovieId] = useState("all")
  const [editing, setEditing] = useState<Session | "new" | null>(null)
  const [cancelId, setCancelId] = useState<number | null>(null)
  const [removeId, setRemoveId] = useState<number | null>(null)
  const movies = useQuery({ queryKey: ["movies", "options"], queryFn: () => cinema.movies.list({ page: 1, pageSize: 100 }) })
  const sessions = useQuery({
    queryKey: ["sessions", "admin", page, movieId],
    queryFn: () => cinema.sessions.list({ page, pageSize: 10, movieId: movieId === "all" ? undefined : Number(movieId) }),
  })
  const cancel = useMutation({
    mutationFn: (id: number) => cinema.sessions.cancel(id),
    onSuccess: async () => {
      toast.success("Session cancelled. Active tickets were released.")
      setCancelId(null)
      await queryClient.invalidateQueries({ queryKey: ["sessions"] })
      await queryClient.invalidateQueries({ queryKey: ["bookings"] })
    },
    onError: (error) => toast.error(errorText(error)),
  })
  const remove = useMutation({
    mutationFn: (id: number) => cinema.sessions.remove(id),
    onSuccess: async () => {
      toast.success("Session deleted")
      setRemoveId(null)
      await queryClient.invalidateQueries({ queryKey: ["sessions"] })
    },
    onError: (error) => toast.error(errorText(error)),
  })

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-4xl">Sessions</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Start times are sent in UTC. Pick them in Tbilisi time. A session with active bookings cannot be edited, and one with any booking history cannot be deleted.
          </p>
        </div>
        <Button className="h-10 px-4" onClick={() => setEditing("new")}>Add session</Button>
      </div>
      <div className="mt-4 max-w-xs">
        <Select value={movieId} onValueChange={(value) => { setMovieId(value ?? "all"); setPage(1) }}>
          <SelectTrigger className="h-10 w-full"><SelectValue placeholder="All films" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All films</SelectItem>
            {(movies.data?.movies ?? []).map((movie) => (
              <SelectItem key={movie.id} value={String(movie.id)}>{movie.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="mt-6">
        {sessions.isError ? <ErrorBlock error={sessions.error} onRetry={() => sessions.refetch()} /> : null}
        {sessions.data && sessions.data.sessions.length === 0 ? <EmptyBlock title="No sessions" body="Schedule a future screening to open sales." /> : null}
        <div className="space-y-3">
          {(sessions.data?.sessions ?? []).map((session) => (
            <article key={session.id} className="rounded-2xl border border-border/80 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-medium">{session.movieTitle}</h2>
                  <p className="text-sm text-muted-foreground">{formatWhen(session.startsAt)} · {session.hallName}</p>
                  <p className="text-sm">{formatMoney(session.standardPrice)} / {formatMoney(session.vipPrice)} VIP</p>
                </div>
                <StatusPill value={session.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" className="h-8" onClick={() => setEditing(session)}>Edit</Button>
                <Button variant="ghost" className="h-8" onClick={() => setCancelId(session.id)}>Cancel screening</Button>
                <Button variant="ghost" className="h-8 text-destructive" onClick={() => setRemoveId(session.id)}>Delete</Button>
              </div>
            </article>
          ))}
        </div>
      </div>
      <SessionDialog
        open={editing != null}
        session={editing === "new" ? null : editing}
        onOpenChange={(open) => { if (!open) setEditing(null) }}
      />
      <ConfirmDialog
        open={cancelId != null}
        onOpenChange={(open) => { if (!open) setCancelId(null) }}
        title="Cancel this screening?"
        description="Active bookings are cancelled with it. When SMTP is configured, CinemaGo emails those customers. A completed screening cannot be cancelled."
        confirmLabel="Cancel screening"
        destructive
        pending={cancel.isPending}
        onConfirm={() => { if (cancelId != null) cancel.mutate(cancelId) }}
      />
      <ConfirmDialog
        open={removeId != null}
        onOpenChange={(open) => { if (!open) setRemoveId(null) }}
        title="Delete this session?"
        description="Deletion is refused once any booking exists, including cancelled ones."
        confirmLabel="Delete session"
        destructive
        pending={remove.isPending}
        onConfirm={() => { if (removeId != null) remove.mutate(removeId) }}
      />
    </div>
  )
}

function SessionDialog({
  open,
  session,
  onOpenChange,
}: {
  open: boolean
  session: Session | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open ? <SessionForm session={session} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function SessionForm({ session, onDone }: { session: Session | null; onDone: () => void }) {
  const queryClient = useQueryClient()
  const movies = useQuery({ queryKey: ["movies", "options"], queryFn: () => cinema.movies.list({ page: 1, pageSize: 100 }) })
  const halls = useQuery({ queryKey: ["halls"], queryFn: () => cinema.halls.list() })
  const [form, setForm] = useState({
    movieId: session ? String(session.movieId) : "",
    hallId: session ? String(session.hallId) : "",
    startsAt: session ? utcToTbilisiInput(session.startsAt) : "",
    standardPrice: session?.standardPrice ?? 15,
    vipPrice: session?.vipPrice ?? 25,
  })
  const save = useMutation({
    mutationFn: () => {
      const body: SessionInput = {
        movieId: Number(form.movieId),
        hallId: Number(form.hallId),
        startsAt: tbilisiLocalToUtcIso(form.startsAt),
        standardPrice: Number(form.standardPrice),
        vipPrice: Number(form.vipPrice),
      }
      return session ? cinema.sessions.update(session.id, body) : cinema.sessions.create(body)
    },
    onSuccess: async () => {
      toast.success(session ? "Session updated" : "Session added")
      await queryClient.invalidateQueries({ queryKey: ["sessions"] })
      onDone()
    },
    onError: (error) => toast.error(errorText(error)),
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (!form.startsAt) {
          toast.error("Choose a start date and time.")
          return
        }
        save.mutate()
      }}
    >
      <DialogHeader>
        <DialogTitle>{session ? "Edit session" : "Add session"}</DialogTitle>
        <DialogDescription>The start must be in the future. VIP price cannot be below the standard price. Overlapping shows in the same hall are rejected.</DialogDescription>
      </DialogHeader>
      <div className="mt-4 space-y-3">
        <Choice label="Film" value={form.movieId} onChange={(movieId) => setForm({ ...form, movieId })} options={(movies.data?.movies ?? []).map((movie) => ({ value: String(movie.id), label: movie.title }))} />
        <Choice label="Hall" value={form.hallId} onChange={(hallId) => setForm({ ...form, hallId })} options={(halls.data ?? []).map((hall) => ({ value: String(hall.id), label: hall.name }))} />
        <div className="space-y-1.5">
          <Label htmlFor="starts">Starts (Tbilisi, UTC+4)</Label>
          <DateTimePicker id="starts" value={form.startsAt} min={tbilisiDayKey(new Date())} onChange={(startsAt) => setForm({ ...form, startsAt })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="standard">Standard price</Label>
            <Input id="standard" className="h-10" type="number" min={0} step="0.01" value={form.standardPrice} onChange={(event) => setForm({ ...form, standardPrice: Number(event.target.value) })} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vip">VIP price</Label>
            <Input id="vip" className="h-10" type="number" min={0} step="0.01" value={form.vipPrice} onChange={(event) => setForm({ ...form, vipPrice: Number(event.target.value) })} required />
          </div>
        </div>
      </div>
      <DialogFooter className="mt-4">
        <Button type="submit" className="h-10" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save session"}</Button>
      </DialogFooter>
    </form>
  )
}

function Choice({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(next) => onChange(next ?? "")}>
        <SelectTrigger className="h-10 w-full"><SelectValue placeholder={`Choose ${label.toLowerCase()}`} /></SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
