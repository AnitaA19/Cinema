"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { cinema } from "@/lib/api"
import { formatAge, formatDuration, formatMoney, formatWhen, hasStarted, isScheduled } from "@/lib/format"
import { MovieCard } from "@/components/movie-card"
import { Poster } from "@/components/poster"
import { ErrorBlock, LoadingBlock } from "@/components/states"
import { Button } from "@/components/ui/button"
import type { Session } from "@/lib/types"

export function HomePage() {
  const movies = useQuery({
    queryKey: ["movies", { page: 1, pageSize: 12 }],
    queryFn: () => cinema.movies.list({ page: 1, pageSize: 12 }),
  })
  const sessions = useQuery({
    queryKey: ["sessions", { page: 1, pageSize: 50 }],
    queryFn: () => cinema.sessions.list({ page: 1, pageSize: 50 }),
  })

  if (movies.isLoading || sessions.isLoading) return <div className="mx-auto max-w-6xl px-4 py-10"><LoadingBlock /></div>
  if (movies.isError) return <div className="mx-auto max-w-6xl px-4 py-10"><ErrorBlock error={movies.error} onRetry={() => movies.refetch()} /></div>
  if (sessions.isError) return <div className="mx-auto max-w-6xl px-4 py-10"><ErrorBlock error={sessions.error} onRetry={() => sessions.refetch()} /></div>

  const catalogue = movies.data?.movies ?? []
  const upcoming = (sessions.data?.sessions ?? [])
    .filter((session) => isScheduled(session.status) && !hasStarted(session.startsAt))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const featuredSession = upcoming[0]
  const featuredMovie = catalogue.find((movie) => movie.id === featuredSession?.movieId) ?? catalogue[0]

  return (
    <div>
      {featuredMovie ? (
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
          <div>
            <p className="text-xs tracking-[0.28em] text-primary uppercase">Now at CinemaGo</p>
            <h1 className="mt-3 font-heading text-5xl leading-[0.95] sm:text-7xl">{featuredMovie.title}</h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              {formatDuration(featuredMovie.durationMinutes)} · {formatAge(featuredMovie.ageRating)}
              {featuredMovie.genres.length ? ` · ${featuredMovie.genres.map((genre) => genre.name).join(" / ")}` : ""}
            </p>
            {featuredSession ? (
              <p className="mt-3 text-sm">
                Next screening {formatWhen(featuredSession.startsAt)} in {featuredSession.hallName} · from{" "}
                {formatMoney(featuredSession.standardPrice)}
              </p>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No upcoming screening is on the board yet.</p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              {featuredSession ? (
                <Button className="h-11 px-5" render={<Link href={`/sessions/${featuredSession.id}`} />}>
                  Choose seats
                </Button>
              ) : null}
              <Button className="h-11 px-5" variant="outline" render={<Link href={`/movies/${featuredMovie.id}`} />}>
                Film details
              </Button>
            </div>
          </div>
          <Poster title={featuredMovie.title} src={featuredMovie.posterUrl} className="aspect-[4/5] rounded-[2rem] border border-white/10 shadow-2xl" />
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="font-heading text-5xl">The house is quiet</h1>
          <p className="mt-3 max-w-lg text-muted-foreground">No films are published yet. An admin can add the programme from the desk.</p>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="font-heading text-3xl">On the programme</h2>
          <Link href="/movies" className="text-sm text-primary">All films</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {catalogue.slice(0, 4).map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              nextShowing={nextLabel(upcoming, movie.id)}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="font-heading text-3xl">Coming up</h2>
          <Link href="/schedule" className="text-sm text-primary">Full schedule</Link>
        </div>
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border/80 bg-card/60">
          {upcoming.slice(0, 5).map((session) => (
            <Link key={session.id} href={`/sessions/${session.id}`} className="grid gap-1 px-4 py-4 transition hover:bg-muted/40 sm:grid-cols-[160px_1fr_auto] sm:items-center">
              <span className="text-sm text-muted-foreground">{formatWhen(session.startsAt)}</span>
              <span>
                <span className="font-medium">{session.movieTitle}</span>
                <span className="ml-2 text-sm text-muted-foreground">{session.hallName}</span>
              </span>
              <span className="text-sm">{formatMoney(session.standardPrice)}</span>
            </Link>
          ))}
          {upcoming.length === 0 ? <p className="px-4 py-8 text-sm text-muted-foreground">No future sessions are scheduled.</p> : null}
        </div>
      </section>
    </div>
  )
}

function nextLabel(sessions: Session[], movieId: number) {
  const next = sessions.find((session) => session.movieId === movieId)
  return next ? formatWhen(next.startsAt) : undefined
}
