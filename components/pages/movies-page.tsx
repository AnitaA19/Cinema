"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { cinema } from "@/lib/api"
import { formatWhen, hasStarted, isScheduled } from "@/lib/format"
import { MovieCard } from "@/components/movie-card"
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/states"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function MoviesPage() {
  const [title, setTitle] = useState("")
  const [query, setQuery] = useState("")
  const [genreId, setGenreId] = useState<number | undefined>()
  const [page, setPage] = useState(1)

  const genres = useQuery({ queryKey: ["genres"], queryFn: () => cinema.genres.list() })
  const movies = useQuery({
    queryKey: ["movies", { title: query, genreId, page }],
    queryFn: () => cinema.movies.list({ title: query || undefined, genreId, page, pageSize: 8 }),
  })
  const sessions = useQuery({
    queryKey: ["sessions", "board"],
    queryFn: () => cinema.sessions.list({ page: 1, pageSize: 100 }),
  })

  const upcoming = (sessions.data?.sessions ?? []).filter(
    (session) => isScheduled(session.status) && !hasStarted(session.startsAt),
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="max-w-2xl">
        <p className="text-xs tracking-[0.22em] text-primary uppercase">Catalogue</p>
        <h1 className="mt-2 font-heading text-4xl sm:text-5xl">Films</h1>
        <p className="mt-2 text-muted-foreground">Search the CinemaGo catalogue and filter by genre.</p>
      </div>
      <form
        className="mt-6 flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault()
          setPage(1)
          setQuery(title.trim())
        }}
      >
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Search by title"
          className="h-10"
          aria-label="Search films by title"
        />
        <Button className="h-10 px-4" type="submit">Search</Button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        <FilterChip active={!genreId} onClick={() => { setGenreId(undefined); setPage(1) }}>All genres</FilterChip>
        {(genres.data ?? []).map((genre) => (
          <FilterChip
            key={genre.id}
            active={genreId === genre.id}
            onClick={() => {
              setGenreId(genre.id)
              setPage(1)
            }}
          >
            {genre.name}
          </FilterChip>
        ))}
      </div>
      <div className="mt-8">
        {movies.isLoading ? <LoadingBlock /> : null}
        {movies.isError ? <ErrorBlock error={movies.error} onRetry={() => movies.refetch()} /> : null}
        {movies.data && movies.data.movies.length === 0 ? (
          <EmptyBlock title="Nothing matches" body="Try another title or clear the genre filter." />
        ) : null}
        {movies.data && movies.data.movies.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {movies.data.movies.map((movie) => {
                const next = upcoming.find((session) => session.movieId === movie.id)
                return <MovieCard key={movie.id} movie={movie} nextShowing={next ? formatWhen(next.startsAt) : undefined} />
              })}
            </div>
            <div className="mt-6 flex items-center justify-between text-sm">
              <p className="text-muted-foreground">
                Page {movies.data.page} of {Math.max(movies.data.totalPages, 1)} · {movies.data.totalCount} films
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="h-9" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  className="h-9"
                  disabled={page >= movies.data.totalPages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

function FilterChip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm ${active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  )
}
