import Link from "next/link"
import { Poster } from "@/components/poster"
import { formatAge, formatDuration } from "@/lib/format"
import type { Movie } from "@/lib/types"

export function MovieCard({ movie, nextShowing }: { movie: Movie; nextShowing?: string }) {
  return (
    <Link
      href={`/movies/${movie.id}`}
      className="group overflow-hidden rounded-2xl border border-border/70 bg-card/80 transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card"
    >
      <Poster title={movie.title} src={movie.posterUrl} className="aspect-[2/3]" eyebrow={formatAge(movie.ageRating)} />
      <div className="space-y-2 p-4">
        <h3 className="font-heading text-xl leading-tight group-hover:text-primary">{movie.title}</h3>
        <p className="text-sm text-muted-foreground">
          {formatDuration(movie.durationMinutes)}
          {movie.genres.length ? ` · ${movie.genres.map((genre) => genre.name).join(", ")}` : ""}
        </p>
        {nextShowing ? <p className="text-xs text-primary">{nextShowing}</p> : null}
      </div>
    </Link>
  )
}
