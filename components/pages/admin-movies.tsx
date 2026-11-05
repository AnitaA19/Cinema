"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { cinema, errorText } from "@/lib/api"
import { formatAge, formatDuration } from "@/lib/format"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { ErrorBlock, EmptyBlock } from "@/components/states"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Poster } from "@/components/poster"
import type { Movie, MovieInput } from "@/lib/types"

const empty: MovieInput = { title: "", durationMinutes: 120, ageRating: 12, posterUrl: '', genreIds: [] }

export function AdminMovies() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Movie | null>(null)
  const [creating, setCreating] = useState(false)
  const [removeId, setRemoveId] = useState<number | null>(null)
  const movies = useQuery({
    queryKey: ["movies", "admin", page],
    queryFn: () => cinema.movies.list({ page, pageSize: 10 }),
  })
  const remove = useMutation({
    mutationFn: (id: number) => cinema.movies.remove(id),
    onSuccess: async () => {
      toast.success("Film removed")
      setRemoveId(null)
      await queryClient.invalidateQueries({ queryKey: ["movies"] })
    },
    onError: (error) => toast.error(errorText(error)),
  })

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-4xl">Movies</h1>
          <p className="mt-1 text-sm text-muted-foreground">Title, runtime, age rating, and up to 20 genres.</p>
        </div>
        <Button className="h-10 px-4" onClick={() => setCreating(true)}>Add film</Button>
      </div>
      <div className="mt-6">
        {movies.isError ? <ErrorBlock error={movies.error} onRetry={() => movies.refetch()} /> : null}
        {movies.data && movies.data.movies.length === 0 ? <EmptyBlock title="No films" body="Add the first title to open the programme." /> : null}
        <div className="overflow-x-auto rounded-2xl border border-border/80">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Runtime</th>
                <th className="px-4 py-3 font-medium">Age</th>
                <th className="px-4 py-3 font-medium">Genres</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {(movies.data?.movies ?? []).map((movie) => (
                <tr key={movie.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{movie.title}</td>
                  <td className="px-4 py-3">{formatDuration(movie.durationMinutes)}</td>
                  <td className="px-4 py-3">{formatAge(movie.ageRating)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{movie.genres.map((genre) => genre.name).join(", ") || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" className="h-8" onClick={() => setEditing(movie)}>Edit</Button>
                    <Button variant="ghost" className="h-8 text-destructive" onClick={() => setRemoveId(movie.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {movies.data && movies.data.totalPages > 1 ? (
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" className="h-8" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
            <Button variant="outline" className="h-8" disabled={page >= movies.data.totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
          </div>
        ) : null}
      </div>
      <MovieDialog
        open={creating || editing != null}
        movie={editing}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false)
            setEditing(null)
          }
        }}
      />
      <ConfirmDialog
        open={removeId != null}
        onOpenChange={(open) => { if (!open) setRemoveId(null) }}
        title="Delete this film?"
        description="CinemaGo refuses the delete when the film still has sessions."
        confirmLabel="Delete film"
        destructive
        pending={remove.isPending}
        onConfirm={() => { if (removeId != null) remove.mutate(removeId) }}
      />
    </div>
  )
}

function MovieDialog({
  open,
  movie,
  onOpenChange,
}: {
  open: boolean
  movie: Movie | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {open ? <MovieForm movie={movie} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function MovieForm({ movie, onDone }: { movie: Movie | null; onDone: () => void }) {
  const queryClient = useQueryClient()
  const genres = useQuery({ queryKey: ["genres"], queryFn: () => cinema.genres.list() })
  const [form, setForm] = useState<MovieInput>(
    movie
      ? {
          title: movie.title,
          durationMinutes: movie.durationMinutes,
          ageRating: movie.ageRating,
          posterUrl: movie.posterUrl ?? '',
          genreIds: movie.genres.map((genre) => genre.id),
        }
      : empty,
  )
  const [file, setFile] = useState<File | null>(null)
  const [removePoster, setRemovePoster] = useState(false)
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  const shownPoster = preview ?? (removePoster ? null : movie?.posterUrl ?? null)
  const save = useMutation({
    mutationFn: async () => {
      const saved = movie ? await cinema.movies.update(movie.id, form) : await cinema.movies.create(form)
      if (file) await cinema.movies.uploadPoster(saved.id, file)
      else if (removePoster && movie) await cinema.movies.removePoster(saved.id)
      return saved
    },
    onSuccess: async () => {
      toast.success(movie ? "Film updated" : "Film added")
      await queryClient.invalidateQueries({ queryKey: ["movies"] })
      onDone()
    },
    onError: (error) => toast.error(errorText(error)),
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        save.mutate()
      }}
    >
      <DialogHeader>
        <DialogTitle>{movie ? "Edit film" : "Add film"}</DialogTitle>
        <DialogDescription>Saving replaces the genre list. An empty selection clears every genre.</DialogDescription>
      </DialogHeader>
      <div className="mt-4 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" className="h-10" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required maxLength={200} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="runtime">Minutes</Label>
            <Input id="runtime" className="h-10" type="number" min={1} max={1000} value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="age">Age rating</Label>
            <Input id="age" className="h-10" type="number" min={0} max={21} value={form.ageRating} onChange={(event) => setForm({ ...form, ageRating: Number(event.target.value) })} required />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="poster-file">Poster</Label>
          <div className="flex flex-col items-start gap-3 min-[400px]:flex-row">
            <Poster title={form.title || "Film"} src={shownPoster} className="aspect-[2/3] w-20 shrink-0 rounded-lg border border-white/10" />
            <div className="w-full min-w-0 flex-1 space-y-2">
              <Input
                id="poster-file"
                className="h-10"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const picked = event.target.files?.[0] ?? null
                  if (picked && picked.size > 5 * 1024 * 1024) {
                    toast.error("The poster must be 5 MB or smaller.")
                    event.target.value = ""
                    return
                  }
                  setFile(picked)
                  if (picked) setRemovePoster(false)
                }}
              />
              <p className="text-xs text-muted-foreground">JPEG, PNG or WebP, up to 5 MB. Uploaded when you save.</p>
              {(file || (movie?.posterUrl && !removePoster)) ? (
                <Button type="button" variant="outline" size="sm" onClick={() => { setFile(null); setRemovePoster(true) }}>
                  Remove poster
                </Button>
              ) : null}
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="poster">Or poster URL</Label>
          <Input id="poster" className="h-10" placeholder="/posters/film.svg or https://..." value={form.posterUrl ?? ''} onChange={(event) => setForm({ ...form, posterUrl: event.target.value })} maxLength={500} />
        </div>
        <div>
          <p className="text-sm font-medium">Genres</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(genres.data ?? []).map((genre) => (
              <label key={genre.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.genreIds.includes(genre.id)}
                  onCheckedChange={(checked) => {
                    setForm((current) => ({
                      ...current,
                      genreIds: checked
                        ? [...current.genreIds, genre.id]
                        : current.genreIds.filter((id) => id !== genre.id),
                    }))
                  }}
                />
                {genre.name}
              </label>
            ))}
          </div>
        </div>
      </div>
      <DialogFooter className="mt-4">
        <Button type="submit" className="h-10 w-full px-4 sm:w-auto" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save film"}</Button>
      </DialogFooter>
    </form>
  )
}
