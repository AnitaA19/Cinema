"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { cinema } from "@/lib/api"
import { formatAge, formatDuration, formatMoney, formatWhen, hasStarted, isScheduled, sessionStatusName } from "@/lib/format"
import { Poster } from "@/components/poster"
import { StatusPill } from "@/components/status-pill"
import { ErrorBlock, LoadingBlock } from "@/components/states"
import { Button } from "@/components/ui/button"

export function MovieDetailPage({ id }: { id: number }) {
  const movie = useQuery({ queryKey: ["movie", id], queryFn: () => cinema.movies.get(id) })
  const sessions = useQuery({
    queryKey: ["sessions", { movieId: id }],
    queryFn: () => cinema.sessions.list({ movieId: id, page: 1, pageSize: 50 }),
  })

  if (movie.isLoading) return <div className="mx-auto max-w-6xl px-4 py-10"><LoadingBlock label="Loading film" /></div>
  if (movie.isError) return <div className="mx-auto max-w-6xl px-4 py-10"><ErrorBlock error={movie.error} onRetry={() => movie.refetch()} /></div>
  if (!movie.data) return null

  const film = movie.data
  const rows = [...(sessions.data?.sessions ?? [])].sort((a, b) => a.startsAt.localeCompare(b.startsAt))

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[280px_1fr]">
      <Poster title={film.title} src={film.posterUrl} className="aspect-[2/3] rounded-3xl border border-white/10" eyebrow={formatAge(film.ageRating)} />
      <div>
        <p className="text-xs tracking-[0.22em] text-primary uppercase">Film</p>
        <h1 className="mt-2 font-heading text-5xl">{film.title}</h1>
        <p className="mt-3 text-muted-foreground">
          {formatDuration(film.durationMinutes)} · {formatAge(film.ageRating)}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {film.genres.map((genre) => (
            <span key={genre.id} className="rounded-full border border-border px-3 py-1 text-sm">{genre.name}</span>
          ))}
          {film.genres.length === 0 ? <span className="text-sm text-muted-foreground">No genres assigned</span> : null}
        </div>
        <h2 className="mt-10 font-heading text-3xl">Screenings</h2>
        {sessions.isLoading ? <p className="mt-4 text-sm text-muted-foreground">Loading sessions…</p> : null}
        {sessions.isError ? <div className="mt-4"><ErrorBlock error={sessions.error} onRetry={() => sessions.refetch()} /></div> : null}
        <div className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border/80">
          {rows.map((session) => {
            const bookable = isScheduled(session.status) && !hasStarted(session.startsAt)
            return (
              <div key={session.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{formatWhen(session.startsAt)}</p>
                  <p className="text-sm text-muted-foreground">
                    {session.hallName} · {formatMoney(session.standardPrice)} standard · {formatMoney(session.vipPrice)} VIP
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill value={sessionStatusName(session.status)} />
                  {bookable ? (
                    <Button className="h-9 px-3" render={<Link href={`/sessions/${session.id}`} />}>Book</Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">{hasStarted(session.startsAt) && isScheduled(session.status) ? "Already started" : "Not on sale"}</span>
                  )}
                </div>
              </div>
            )
          })}
          {rows.length === 0 && !sessions.isLoading ? (
            <p className="px-4 py-8 text-sm text-muted-foreground">No sessions for this film yet.</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
