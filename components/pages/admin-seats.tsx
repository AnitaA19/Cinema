"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"
import { cinema, errorText } from "@/lib/api"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { ErrorBlock } from "@/components/states"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Seat } from "@/lib/types"

type Position = { rowNumber: number; seatNumber: number }
type Mode = "single" | "row"

export function AdminSeats({ hallId }: { hallId: number }) {
  const queryClient = useQueryClient()
  const hall = useQuery({ queryKey: ["hall", hallId], queryFn: () => cinema.halls.get(hallId) })
  const seats = useQuery({ queryKey: ["seats", hallId], queryFn: () => cinema.seats.list(hallId) })

  const list = useMemo(() => seats.data ?? [], [seats.data])
  const capacity = hall.data?.capacity ?? 0
  const room = Math.max(capacity - list.length, 0)
  const full = Boolean(hall.data && seats.data) && room === 0
  const vipCount = list.filter((seat) => seat.isVip).length

  const rows = useMemo(() => [...new Set(list.map((seat) => seat.rowNumber))].sort((a, b) => a - b), [list])
  const lastRow = rows.at(-1) ?? 0
  const widest = list.reduce((max, seat) => Math.max(max, seat.seatNumber), 0)
  const seatAt = useMemo(() => new Map(list.map((seat) => [`${seat.rowNumber}:${seat.seatNumber}`, seat])), [list])

  const [mode, setMode] = useState<Mode>("single")
  const [single, setSingle] = useState<(Position & { isVip: boolean }) | null>(null)
  const [rowDraft, setRowDraft] = useState<{ rowNumber: number; from: number; count: number; isVip: boolean } | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [edit, setEdit] = useState<Position & { isVip: boolean }>({ rowNumber: 1, seatNumber: 1, isVip: false })
  const [removeId, setRemoveId] = useState<number | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)

  const nextInRow = (row: number) => list.filter((seat) => seat.rowNumber === row).reduce((max, seat) => Math.max(max, seat.seatNumber), 0) + 1
  const singleValue = single ?? { rowNumber: lastRow || 1, seatNumber: lastRow ? nextInRow(lastRow) : 1, isVip: false }
  const rowValue = rowDraft ?? { rowNumber: lastRow + 1, from: 1, count: Math.min(widest || 10, room || 10), isVip: false }
  const selected = list.find((seat) => seat.id === selectedId) ?? null

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["seats"] })
    await queryClient.invalidateQueries({ queryKey: ["halls"] })
  }

  const create = useMutation({
    mutationFn: (seat: Position & { isVip: boolean }) => cinema.seats.create({ hallId, ...seat }),
    onSuccess: async (created) => {
      toast.success(`Row ${created.rowNumber}, seat ${created.seatNumber} added`)
      setSingle({ rowNumber: created.rowNumber, seatNumber: created.seatNumber + 1, isVip: created.isVip })
      await refresh()
    },
    onError: (error) => toast.error(errorText(error)),
  })

  const addRow = useMutation({
    mutationFn: async (draft: typeof rowValue) => {
      const taken = new Set(list.filter((seat) => seat.rowNumber === draft.rowNumber).map((seat) => seat.seatNumber))
      const wanted = Array.from({ length: draft.count }, (_, index) => draft.from + index).filter((number) => !taken.has(number))
      const batch = wanted.slice(0, room)
      setProgress({ done: 0, total: batch.length })
      for (const [index, seatNumber] of batch.entries()) {
        await cinema.seats.create({ hallId, rowNumber: draft.rowNumber, seatNumber, isVip: draft.isVip })
        setProgress({ done: index + 1, total: batch.length })
      }
      return { added: batch.length, skipped: draft.count - batch.length, rowNumber: draft.rowNumber }
    },
    onSuccess: ({ added, skipped, rowNumber }) => {
      if (added === 0) toast.message("Nothing to add: those seats exist already or the hall is full.")
      else toast.success(`Row ${rowNumber}: ${added} seat${added === 1 ? "" : "s"} added${skipped ? `, ${skipped} skipped` : ""}`)
      setRowDraft(null)
    },
    onError: (error) => toast.error(errorText(error)),
    onSettled: async () => {
      setProgress(null)
      await refresh()
    },
  })

  const update = useMutation({
    mutationFn: (id: number) => cinema.seats.update(id, edit),
    onSuccess: async () => {
      toast.success("Seat updated")
      await refresh()
    },
    onError: (error) => toast.error(errorText(error)),
  })

  const remove = useMutation({
    mutationFn: (id: number) => cinema.seats.remove(id),
    onSuccess: async (_, id) => {
      toast.success("Seat deleted")
      setRemoveId(null)
      if (selectedId === id) setSelectedId(null)
      await refresh()
    },
    onError: (error) => {
      setRemoveId(null)
      toast.error(errorText(error))
    },
  })

  function select(seat: Seat) {
    setSelectedId(seat.id)
    setEdit({ rowNumber: seat.rowNumber, seatNumber: seat.seatNumber, isVip: seat.isVip })
  }

  function addAt(position: Position) {
    if (full) return toast.message(`The hall is full (capacity ${capacity}).`)
    setSelectedId(null)
    create.mutate({ ...position, isVip: false })
  }

  if (hall.isError) return <ErrorBlock error={hall.error} onRetry={() => hall.refetch()} />

  const busy = create.isPending || addRow.isPending
  const changed = selected && (selected.rowNumber !== edit.rowNumber || selected.seatNumber !== edit.seatNumber || selected.isVip !== edit.isVip)
  const columns = full ? widest : Math.max(widest + 1, 1)
  const mapRows = full ? rows : [...rows, lastRow + 1]

  return (
    <div>
      <Button variant="ghost" className="mb-3 h-8 gap-1.5 px-0 text-muted-foreground hover:text-foreground" render={<Link href="/admin/halls" />}>
        <ArrowLeft className="size-4" /> All halls
      </Button>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-4xl">{hall.data?.name ?? "Hall"}</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Click an empty slot to add a seat there, or a seat to edit it. Booked seats can only change VIP status.
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Stat label="Seats" value={`${list.length} / ${capacity || "—"}`} />
          <Stat label="VIP" value={String(vipCount)} />
          <Stat label="Free" value={String(room)} />
        </div>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-foreground/10">
        <div
          className={cn("h-full rounded-full transition-all", full ? "bg-destructive/70" : "bg-primary")}
          style={{ width: `${capacity ? Math.min((list.length / capacity) * 100, 100) : 0}%` }}
        />
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-3xl border border-border/80 bg-card/60 p-4 sm:p-6">
          <div className="mx-auto mb-2 h-1.5 max-w-sm rounded-full bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_10px_30px_oklch(0.83_0.12_84/0.4)]" />
          <p className="mb-6 text-center text-[11px] tracking-[0.28em] text-muted-foreground uppercase">Screen</p>
          {seats.isLoading ? <p className="py-10 text-center text-sm text-muted-foreground">Loading seats…</p> : null}
          {seats.isError ? <ErrorBlock error={seats.error} onRetry={() => seats.refetch()} /> : null}
          {seats.data ? (
            <div className="overflow-x-auto pb-2">
              <div className="mx-auto w-fit space-y-1.5">
                {mapRows.map((row) => {
                  const isNewRow = row === lastRow + 1
                  return (
                    <div key={row} className={cn("flex items-center gap-1.5", isNewRow && "opacity-60 hover:opacity-100")}>
                      <span className="w-7 shrink-0 text-center text-[11px] text-muted-foreground">{isNewRow ? <Plus className="mx-auto size-3" /> : row}</span>
                      {Array.from({ length: isNewRow ? Math.max(columns - 1, 1) : columns }, (_, index) => {
                        const number = index + 1
                        const seat = seatAt.get(`${row}:${number}`)
                        if (seat) {
                          return (
                            <button
                              key={number}
                              type="button"
                              onClick={() => select(seat)}
                              aria-label={`Row ${row}, seat ${number}${seat.isVip ? ", VIP" : ""}`}
                              aria-pressed={seat.id === selectedId}
                              className={cn(
                                "grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-[11px] transition sm:size-9",
                                seat.isVip ? "bg-primary/20 text-primary ring-1 ring-primary/50 hover:bg-primary/30" : "bg-foreground/10 hover:bg-foreground/20",
                                seat.id === selectedId && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-card",
                              )}
                            >
                              {number}
                            </button>
                          )
                        }
                        return (
                          <button
                            key={number}
                            type="button"
                            disabled={busy || full}
                            onClick={() => addAt({ rowNumber: row, seatNumber: number })}
                            aria-label={`Add row ${row}, seat ${number}`}
                            title={full ? "Hall is full" : `Add row ${row}, seat ${number}`}
                            className="group grid size-8 shrink-0 cursor-pointer place-items-center rounded-md border border-dashed border-foreground/20 text-muted-foreground/35 transition hover:border-primary hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-foreground/20 disabled:hover:bg-transparent disabled:hover:text-muted-foreground/35 sm:size-9"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
              {list.length === 0 ? (
                <p className="mt-4 text-center text-sm text-muted-foreground">No seats yet. Add a whole row from the panel, or click the dashed slot.</p>
              ) : null}
            </div>
          ) : null}
          <div className="mt-5 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            <Legend className="bg-foreground/10" label="Standard" />
            <Legend className="bg-primary/30 ring-1 ring-primary/50" label="VIP" />
            <Legend className="bg-primary" label="Selected" />
            <Legend className="border border-dashed border-foreground/30" label="Empty slot" />
          </div>
        </section>

        <aside className="rounded-3xl border border-border/80 bg-card/80 p-5 lg:sticky lg:top-6">
          {selected ? (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                update.mutate(selected.id)
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs tracking-[0.18em] text-primary uppercase">Edit seat</p>
                  <h2 className="mt-1 font-heading text-2xl">Row {selected.rowNumber}, seat {selected.seatNumber}</h2>
                </div>
                <button type="button" aria-label="Close" onClick={() => setSelectedId(null)} className="grid size-8 cursor-pointer place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground">
                  <X className="size-4" />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <NumberField id="edit-row" label="Row" value={edit.rowNumber} onChange={(rowNumber) => setEdit({ ...edit, rowNumber })} />
                <NumberField id="edit-seat" label="Seat" value={edit.seatNumber} onChange={(seatNumber) => setEdit({ ...edit, seatNumber })} />
              </div>
              <VipToggle checked={edit.isVip} onChange={(isVip) => setEdit({ ...edit, isVip })} />
              <div className="mt-5 flex gap-2">
                <Button type="submit" className="h-10 flex-1" disabled={!changed || update.isPending}>
                  {update.isPending ? "Saving…" : "Save changes"}
                </Button>
                <Button type="button" variant="destructive" className="h-10 gap-1.5" onClick={() => setRemoveId(selected.id)}>
                  <Trash2 className="size-4" /> Delete
                </Button>
              </div>
            </form>
          ) : (
            <div>
              <p className="text-xs tracking-[0.18em] text-primary uppercase">Add seats</p>
              <div className="mt-3 grid grid-cols-2 rounded-xl bg-foreground/5 p-1 text-sm">
                {(["single", "row"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setMode(option)}
                    className={cn("h-8 cursor-pointer rounded-lg transition", mode === option ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  >
                    {option === "single" ? "One seat" : "Whole row"}
                  </button>
                ))}
              </div>

              {mode === "single" ? (
                <form
                  className="mt-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    create.mutate(singleValue)
                  }}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <NumberField id="add-row" label="Row" value={singleValue.rowNumber} onChange={(rowNumber) => setSingle({ ...singleValue, rowNumber, seatNumber: nextInRow(rowNumber) })} />
                    <NumberField id="add-seat" label="Seat" value={singleValue.seatNumber} onChange={(seatNumber) => setSingle({ ...singleValue, seatNumber })} />
                  </div>
                  <VipToggle checked={singleValue.isVip} onChange={(isVip) => setSingle({ ...singleValue, isVip })} />
                  {seatAt.has(`${singleValue.rowNumber}:${singleValue.seatNumber}`) ? (
                    <p className="mt-3 text-xs text-destructive">That position already has a seat.</p>
                  ) : null}
                  <Button
                    type="submit"
                    className="mt-5 h-10 w-full"
                    disabled={busy || full || seatAt.has(`${singleValue.rowNumber}:${singleValue.seatNumber}`)}
                  >
                    {full ? "Hall is full" : create.isPending ? "Adding…" : `Add row ${singleValue.rowNumber}, seat ${singleValue.seatNumber}`}
                  </Button>
                </form>
              ) : (
                <form
                  className="mt-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    addRow.mutate(rowValue)
                  }}
                >
                  <div className="grid grid-cols-3 gap-3">
                    <NumberField id="row-number" label="Row" value={rowValue.rowNumber} onChange={(rowNumber) => setRowDraft({ ...rowValue, rowNumber })} />
                    <NumberField id="row-from" label="From seat" value={rowValue.from} onChange={(from) => setRowDraft({ ...rowValue, from })} />
                    <NumberField id="row-count" label="Seats" value={rowValue.count} max={100} onChange={(count) => setRowDraft({ ...rowValue, count })} />
                  </div>
                  <VipToggle checked={rowValue.isVip} onChange={(isVip) => setRowDraft({ ...rowValue, isVip })} label="Make this a VIP row" />
                  <p className="mt-3 text-xs text-muted-foreground">
                    Seats {rowValue.from}–{rowValue.from + rowValue.count - 1}. Existing positions are skipped
                    {rowValue.count > room ? `, and only ${room} fit before the hall is full` : ""}.
                  </p>
                  <Button type="submit" className="mt-4 h-10 w-full" disabled={busy || full || rowValue.count < 1}>
                    {full
                      ? "Hall is full"
                      : progress
                        ? `Adding ${progress.done} of ${progress.total}…`
                        : `Add row ${rowValue.rowNumber}`}
                  </Button>
                </form>
              )}
            </div>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={removeId != null}
        onOpenChange={(open) => { if (!open) setRemoveId(null) }}
        title={selected ? `Delete row ${selected.rowNumber}, seat ${selected.seatNumber}?` : "Delete this seat?"}
        description="A seat with bookings cannot be deleted."
        confirmLabel="Delete seat"
        destructive
        pending={remove.isPending}
        onConfirm={() => { if (removeId != null) remove.mutate(removeId) }}
      />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/80 bg-card/60 px-3 py-2">
      <p className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase">{label}</p>
      <p className="font-heading text-lg tabular-nums">{value}</p>
    </div>
  )
}

function NumberField({
  id,
  label,
  value,
  onChange,
  max = 1000,
}: {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  max?: number
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        className="h-10 tabular-nums"
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={value}
        onChange={(event) => onChange(Math.max(1, Math.min(max, Number(event.target.value) || 1)))}
        required
      />
    </div>
  )
}

function VipToggle({ checked, onChange, label = "VIP seat" }: { checked: boolean; onChange: (value: boolean) => void; label?: string }) {
  return (
    <label className="mt-4 flex cursor-pointer items-center gap-2.5 rounded-xl border border-border/80 px-3 py-2.5 text-sm hover:bg-muted/40">
      <Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true)} />
      <span>{label}</span>
      <span className="ml-auto text-xs text-muted-foreground">Priced at the VIP rate</span>
    </label>
  )
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("size-3 rounded-sm", className)} />
      {label}
    </span>
  )
}
