"use client"

import Link from "next/link"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QRCodeSVG } from "qrcode.react"
import { toast } from "sonner"
import { cinema, errorText } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { formatAge, formatDuration, formatMoney, formatWhen, hasStarted, isScheduled } from "@/lib/format"
import { SeatMap } from "@/components/seat-map"
import { ErrorBlock } from "@/components/states"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Booking, SeatAvailability } from "@/lib/types"

export function SessionPage({ id }: { id: number }) {
  const { session: auth } = useAuth()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<number[]>([])
  const [passes, setPasses] = useState<Booking[] | null>(null)

  const screening = useQuery({ queryKey: ["session", id], queryFn: () => cinema.sessions.get(id) })
  const seats = useQuery({ queryKey: ["session-seats", id], queryFn: () => cinema.sessions.seats(id) })
  const movie = useQuery({
    queryKey: ["movie", screening.data?.movieId],
    queryFn: () => cinema.movies.get(screening.data!.movieId),
    enabled: Boolean(screening.data?.movieId),
  })

  const book = useMutation({
    mutationFn: (seatIds: number[]) => cinema.bookings.batch({ sessionId: id, seatIds }),
    onSuccess: async (created) => {
      setPasses(created)
      setSelected([])
      await queryClient.invalidateQueries({ queryKey: ["session-seats", id] })
      await queryClient.invalidateQueries({ queryKey: ["bookings"] })
      toast.success(created.length === 1 ? "Seat reserved" : `${created.length} seats reserved`)
    },
    onError: (error) => toast.error(errorText(error)),
  })

  if (screening.isLoading || seats.isLoading) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-sm text-muted-foreground">Setting the house…</div>
  }
  if (screening.isError) return <div className="mx-auto max-w-5xl px-4 py-10"><ErrorBlock error={screening.error} onRetry={() => screening.refetch()} /></div>
  if (seats.isError) return <div className="mx-auto max-w-5xl px-4 py-10"><ErrorBlock error={seats.error} onRetry={() => seats.refetch()} /></div>
  if (!screening.data) return null

  const show = screening.data
  const bookable = isScheduled(show.status) && !hasStarted(show.startsAt)
  const chosen = (seats.data ?? []).filter((seat) => selected.includes(seat.seatId))
  const total = chosen.reduce((sum, seat) => sum + (seat.isVip ? show.vipPrice : show.standardPrice), 0)

  function toggle(seat: SeatAvailability) {
    setSelected((current) => {
      if (current.includes(seat.seatId)) return current.filter((id) => id !== seat.seatId)
      if (current.length >= 20) {
        toast.message("A booking can hold at most 20 seats.")
        return current
      }
      return [...current, seat.seatId]
    })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs tracking-[0.22em] text-primary uppercase">{show.hallName}</p>
      <h1 className="mt-2 font-heading text-4xl sm:text-5xl">{show.movieTitle}</h1>
      <p className="mt-2 text-muted-foreground">
        {formatWhen(show.startsAt)}
        {movie.data ? ` · ${formatDuration(movie.data.durationMinutes)} · ${formatAge(movie.data.ageRating)}` : ""}
      </p>
      {!bookable ? (
        <p className="mt-4 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
          This screening is not open for booking. Scheduled sessions can be reserved only before they start.
        </p>
      ) : null}
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <SeatMap seats={seats.data ?? []} selected={selected} onToggle={bookable ? toggle : undefined} disabled={!bookable || book.isPending} />
        <aside className="rounded-3xl border border-border/80 bg-card/80 p-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <h2 className="font-heading text-2xl">Your seats</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Standard {formatMoney(show.standardPrice)} · VIP {formatMoney(show.vipPrice)}
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {chosen.length === 0 ? <li className="text-muted-foreground">Select open seats in the house.</li> : null}
            {chosen.map((seat) => (
              <li key={seat.seatId}>
                <button
                  type="button"
                  onClick={() => toggle(seat)}
                  disabled={!bookable || book.isPending}
                  className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-left transition hover:bg-muted/60 disabled:cursor-not-allowed"
                  aria-label={`Remove row ${seat.rowNumber}, seat ${seat.seatNumber}`}
                >
                  <span>Row {seat.rowNumber}, seat {seat.seatNumber}{seat.isVip ? " · VIP" : ""}</span>
                  <span className="tabular-nums text-muted-foreground">{formatMoney(seat.isVip ? show.vipPrice : show.standardPrice)}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-heading text-2xl">{formatMoney(total)}</span>
          </div>
          {auth ? (
            <Button className="mt-4 h-11 w-full" disabled={!bookable || chosen.length === 0 || book.isPending} onClick={() => book.mutate(selected)}>
              {book.isPending ? "Reserving…" : `Reserve ${chosen.length || ""}`.trim()}
            </Button>
          ) : (
            <Button className="mt-4 h-11 w-full" render={<Link href={`/login?next=${encodeURIComponent(`/sessions/${id}`)}`} />}>
              Sign in to reserve
            </Button>
          )}
          <p className="mt-3 text-xs text-muted-foreground">CinemaGo sets the final price. One active booking per seat.</p>
        </aside>
      </div>

      <Dialog open={Boolean(passes)} onOpenChange={(open) => { if (!open) setPasses(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>You are booked</DialogTitle>
            <DialogDescription>Each pass carries the ticket code CinemaGo issued. Show it at the door.</DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[60vh] gap-4 overflow-auto">
            {(passes ?? []).map((pass) => (
              <div key={pass.id} className="flex gap-4 rounded-2xl border border-border p-3">
                {pass.ticketCode ? (
                  <QRCodeSVG value={pass.ticketCode} size={96} bgColor="#241e18" fgColor="#f4ead6" />
                ) : null}
                <div className="text-sm">
                  <p className="font-medium">{pass.movieTitle}</p>
                  <p className="text-muted-foreground">{formatWhen(pass.sessionStartsAt)}</p>
                  <p>Row {pass.rowNumber}, seat {pass.seatNumber}{pass.isVip ? " · VIP" : ""}</p>
                  <p>{formatMoney(pass.finalPrice)}</p>
                  <p className="mt-1 font-mono text-[11px] break-all text-muted-foreground">{pass.ticketCode}</p>
                </div>
              </div>
            ))}
          </div>
          <Button className="h-10" render={<Link href="/account" />}>Open my tickets</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
