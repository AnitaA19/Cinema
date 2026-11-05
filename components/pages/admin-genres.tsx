"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { cinema, errorText } from "@/lib/api"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { ErrorBlock, EmptyBlock } from "@/components/states"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function AdminGenres() {
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [editing, setEditing] = useState<{ id: number; name: string } | null>(null)
  const [removeId, setRemoveId] = useState<number | null>(null)
  const genres = useQuery({ queryKey: ["genres"], queryFn: () => cinema.genres.list() })
  const create = useMutation({
    mutationFn: () => cinema.genres.create({ name }),
    onSuccess: async () => {
      setName("")
      toast.success("Genre added")
      await queryClient.invalidateQueries({ queryKey: ["genres"] })
    },
    onError: (error) => toast.error(errorText(error)),
  })
  const update = useMutation({
    mutationFn: () => cinema.genres.update(editing!.id, { name: editing!.name }),
    onSuccess: async () => {
      setEditing(null)
      toast.success("Genre renamed")
      await queryClient.invalidateQueries({ queryKey: ["genres"] })
      await queryClient.invalidateQueries({ queryKey: ["movies"] })
    },
    onError: (error) => toast.error(errorText(error)),
  })
  const remove = useMutation({
    mutationFn: (id: number) => cinema.genres.remove(id),
    onSuccess: async () => {
      setRemoveId(null)
      toast.success("Genre deleted")
      await queryClient.invalidateQueries({ queryKey: ["genres"] })
    },
    onError: (error) => toast.error(errorText(error)),
  })

  return (
    <div>
      <h1 className="font-heading text-4xl">Genres</h1>
      <p className="mt-1 text-sm text-muted-foreground">Names are unique, ignoring case. A genre on a film cannot be deleted.</p>
      <form
        className="mt-6 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault()
          create.mutate()
        }}
      >
        <Input className="h-10" value={name} maxLength={100} placeholder="New genre" aria-label="New genre" onChange={(event) => setName(event.target.value)} required />
        <Button type="submit" className="h-10 px-4" disabled={create.isPending}>Add genre</Button>
      </form>
      <div className="mt-6">
        {genres.isError ? <ErrorBlock error={genres.error} onRetry={() => genres.refetch()} /> : null}
        {genres.data && genres.data.length === 0 ? <EmptyBlock title="No genres" body="Add Drama, Sci-Fi, or whatever the programme needs." /> : null}
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border/80">
          {(genres.data ?? []).map((genre) => (
            <li key={genre.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
              {editing?.id === genre.id ? (
                <Input className="h-9" value={editing.name} onChange={(event) => setEditing({ id: genre.id, name: event.target.value })} />
              ) : (
                <span className="flex-1 font-medium">{genre.name}</span>
              )}
              <div className="flex gap-2">
                {editing?.id === genre.id ? (
                  <Button className="h-8" disabled={update.isPending} onClick={() => update.mutate()}>Save</Button>
                ) : (
                  <Button variant="ghost" className="h-8" onClick={() => setEditing({ id: genre.id, name: genre.name })}>Rename</Button>
                )}
                <Button variant="ghost" className="h-8 text-destructive" onClick={() => setRemoveId(genre.id)}>Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <ConfirmDialog
        open={removeId != null}
        onOpenChange={(open) => { if (!open) setRemoveId(null) }}
        title="Delete this genre?"
        description="If a film still uses it, CinemaGo keeps the genre."
        confirmLabel="Delete genre"
        destructive
        pending={remove.isPending}
        onConfirm={() => { if (removeId != null) remove.mutate(removeId) }}
      />
    </div>
  )
}
