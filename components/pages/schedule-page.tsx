"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { cinema } from "@/lib/api"
import { formatMoney, formatWhen, tbilisiDayEndUtc, tbilisiDayKey, tbilisiDayStartUtc } from "@/lib/format"
import { DatePicker } from "@/components/date-time-picker"
import { StatusPill } from "@/components/status-pill"
import { ErrorBlock, EmptyBlock } from "@/components/states"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function SchedulePage() {
  const [movieId, setMovieId] = useState("all")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [page, setPage] = useState(1)
  const movies = useQuery({ queryKey: ["movies", "all"], queryFn: () => cinema.movies.list({ page: 1, pageSize: 100 }) })
  const sessions = useQuery({
    queryKey: ["sessions", { movieId, from, to, page }],
    queryFn: () =>
      cinema.sessions.list({
        movieId: movieId === "all" ? undefined : Number(movieId),
        dateFrom: from ? tbilisiDayStartUtc(from) : undefined,
        dateTo: to ? tbilisiDayEndUtc(to) : undefined,
        page,
        pageSize: 20,
      }),
  })

  const sessionRows = sessions.data?.sessions
  const groups = useMemo(() => {
    const map = new Map<string, NonNullable<typeof sessionRows>>()
    for (const session of sessionRows ?? []) {
      const key = tbilisiDayKey(session.startsAt)
      map.set(key, [...(map.get(key) ?? []), session])
    }
    return [...map.entries()]
  }, [sessionRows])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-xs tracking-[0.22em] text-primary uppercase">Showtimes</p>
      <h1 className="mt-2 font-heading text-4xl sm:text-5xl">Schedule</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-[1fr_210px_210px]">
        <Select
          value={movieId}
          onValueChange={(value) => {
            setMovieId(value ?? "all")
            setPage(1)
          }}
        >
          <SelectTrigger className="h-10 w-full sm:col-span-2 md:col-span-1">
            <SelectValue placeholder="All films" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All films</SelectItem>
            {(movies.data?.movies ?? []).map((movie) => (
              <SelectItem key={movie.id} value={String(movie.id)}>{movie.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DatePicker value={from} placeholder="From date" clearable onChange={(value) => { setFrom(value); setPage(1) }} />
        <DatePicker value={to} min={from || undefined} placeholder="To date" clearable onChange={(value) => { setTo(value); setPage(1) }} />
      </div>
      <div className="mt-8 space-y-8">
        {sessions.isLoading ? <p className="text-sm text-muted-foreground">Loading the board…</p> : null}
        {sessions.isError ? <ErrorBlock error={sessions.error} onRetry={() => sessions.refetch()} /> : null}
        {sessions.data && groups.length === 0 ? (
          <EmptyBlock title="No sessions in this range" body="Widen the dates or clear the film filter." />
        ) : null}
        {groups.map(([day, rows]) => (
          <section key={day}>
            <h2 className="font-heading text-2xl">{day}</h2>
            <div className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border/80">
              {rows.map((session) => (
                <Link key={session.id} href={`/sessions/${session.id}`} className="grid gap-2 px-4 py-4 hover:bg-muted/40 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                  <div>
                    <p className="font-medium">{session.movieTitle}</p>
                    <p className="text-sm text-muted-foreground">{formatWhen(session.startsAt)} · {session.hallName}</p>
                  </div>
                  <StatusPill value={session.status} />
                  <span className="text-sm">{formatMoney(session.standardPrice)}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
      {sessions.data && sessions.data.totalPages > 1 ? (
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" className="h-9" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
          <Button variant="outline" className="h-9" disabled={page >= sessions.data.totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
        </div>
      ) : null}
    </div>
  )
}
