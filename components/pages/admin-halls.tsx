"use client"

import Link from "next/link"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { cinema, errorText } from "@/lib/api"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { ErrorBlock, EmptyBlock } from "@/components/states"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AdminHalls() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ id: 0, name: "", capacity: 40 })
  const [removeId, setRemoveId] = useState<number | null>(null)
  const halls = useQuery({ queryKey: ["halls"], queryFn: () => cinema.halls.list() })
  const seats = useQuery({ queryKey: ["seats"], queryFn: () => cinema.seats.list() })
  const save = useMutation({
    mutationFn: () =>
      form.id
        ? cinema.halls.update(form.id, { name: form.name, capacity: Number(form.capacity) })
        : cinema.halls.create({ name: form.name, capacity: Number(form.capacity) }),
    onSuccess: async () => {
      toast.success(form.id ? "Hall updated" : "Hall added")
      setOpen(false)
      await queryClient.invalidateQueries({ queryKey: ["halls"] })
    },
    onError: (error) => toast.error(errorText(error)),
  })
  const remove = useMutation({
    mutationFn: (id: number) => cinema.halls.remove(id),
    onSuccess: async () => {
      setRemoveId(null)
      toast.success("Hall deleted")
      await queryClient.invalidateQueries({ queryKey: ["halls"] })
    },
    onError: (error) => toast.error(errorText(error)),
  })

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-4xl">Halls</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Capacity cannot fall below the seats already drawn. A hall with seats or sessions stays put until those are cleared.
          </p>
        </div>
        <Button className="h-10 px-4" onClick={() => { setForm({ id: 0, name: "", capacity: 40 }); setOpen(true) }}>Add hall</Button>
      </div>
      <div className="mt-6">
        {halls.isError ? <ErrorBlock error={halls.error} onRetry={() => halls.refetch()} /> : null}
        {halls.data && halls.data.length === 0 ? <EmptyBlock title="No halls" body="Add a hall before you can sell seats." /> : null}
        <div className="grid gap-4 md:grid-cols-2">
          {(halls.data ?? []).map((hall) => {
            const count = (seats.data ?? []).filter((seat) => seat.hallId === hall.id).length
            return (
              <article key={hall.id} className="rounded-2xl border border-border/80 bg-card/70 p-4">
                <h2 className="font-heading text-2xl">{hall.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{count} seats · capacity {hall.capacity}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(100, (count / hall.capacity) * 100)}%` }} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button className="h-8" render={<Link href={`/admin/halls/${hall.id}`} />}>Seats</Button>
                  <Button variant="outline" className="h-8" onClick={() => { setForm(hall); setOpen(true) }}>Edit</Button>
                  <Button variant="ghost" className="h-8 text-destructive" onClick={() => setRemoveId(hall.id)}>Delete</Button>
                </div>
              </article>
            )
          })}
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              save.mutate()
            }}
          >
            <DialogHeader>
              <DialogTitle>{form.id ? "Edit hall" : "Add hall"}</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="hall-name">Name</Label>
                <Input id="hall-name" className="h-10" value={form.name} maxLength={100} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="capacity">Capacity</Label>
                <Input id="capacity" className="h-10" type="number" min={1} max={10000} value={form.capacity} onChange={(event) => setForm({ ...form, capacity: Number(event.target.value) })} required />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="submit" className="h-10" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save hall"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={removeId != null}
        onOpenChange={(open) => { if (!open) setRemoveId(null) }}
        title="Delete this hall?"
        description="Delete its seats first, and only if it has no sessions."
        confirmLabel="Delete hall"
        destructive
        pending={remove.isPending}
        onConfirm={() => { if (removeId != null) remove.mutate(removeId) }}
      />
    </div>
  )
}
