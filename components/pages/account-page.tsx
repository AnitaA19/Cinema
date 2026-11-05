"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { cinema, errorText } from "@/lib/api"
import { RequireAuth, useAuth } from "@/lib/auth"
import { formatMoney, formatWhen, hasStarted } from "@/lib/format"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { StatusPill } from "@/components/status-pill"
import { EmptyBlock, ErrorBlock } from "@/components/states"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Booking } from "@/lib/types"

export function AccountPage() {
  return (
    <RequireAuth>
      <AccountBody />
    </RequireAuth>
  )
}

function AccountBody() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [cancelId, setCancelId] = useState<number | null>(null)
  const bookings = useQuery({ queryKey: ["bookings", "mine"], queryFn: () => cinema.bookings.mine() })
  const cancel = useMutation({
    mutationFn: (id: number) => cinema.bookings.cancel(id),
    onSuccess: async () => {
      toast.success("Booking cancelled. The seat is free again.")
      setCancelId(null)
      await queryClient.invalidateQueries({ queryKey: ["bookings"] })
    },
    onError: (error) => toast.error(errorText(error)),
  })

  const groups = useMemo(() => splitBookings(bookings.data ?? []), [bookings.data])

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-xs tracking-[0.22em] text-primary uppercase">Customer panel</p>
      <h1 className="mt-2 font-heading text-4xl sm:text-5xl">Hello, {session?.username}</h1>
      <p className="mt-2 text-muted-foreground">{session?.email} · {session?.role}</p>
      <div className="mt-8">
        {bookings.isLoading ? <p className="text-sm text-muted-foreground">Loading your tickets…</p> : null}
        {bookings.isError ? <ErrorBlock error={bookings.error} onRetry={() => bookings.refetch()} /> : null}
        {bookings.data ? (
          <Tabs defaultValue="upcoming">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="mt-4">
              <BookingList rows={groups.upcoming} empty="No upcoming tickets. The schedule is open." onCancel={setCancelId} />
            </TabsContent>
            <TabsContent value="past" className="mt-4">
              <BookingList rows={groups.past} empty="Past screenings will land here." />
            </TabsContent>
            <TabsContent value="cancelled" className="mt-4">
              <BookingList rows={groups.cancelled} empty="You have not cancelled a booking." />
            </TabsContent>
          </Tabs>
        ) : null}
      </div>
      <ConfirmDialog
        open={cancelId != null}
        onOpenChange={(open) => { if (!open) setCancelId(null) }}
        title="Cancel this booking?"
        description="CinemaGo frees the seat. The ticket stays on record as cancelled."
        confirmLabel="Cancel booking"
        destructive
        pending={cancel.isPending}
        onConfirm={() => { if (cancelId != null) cancel.mutate(cancelId) }}
      />
    </div>
  )
}

function splitBookings(rows: Booking[]) {
  const upcoming: Booking[] = []
  const past: Booking[] = []
  const cancelled: Booking[] = []
  for (const row of rows) {
    if (row.status === "Cancelled") cancelled.push(row)
    else if (hasStarted(row.sessionStartsAt)) past.push(row)
    else upcoming.push(row)
  }
  const byTime = (a: Booking, b: Booking) => a.sessionStartsAt.localeCompare(b.sessionStartsAt)
  upcoming.sort(byTime)
  past.sort((a, b) => b.sessionStartsAt.localeCompare(a.sessionStartsAt))
  cancelled.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return { upcoming, past, cancelled }
}

function BookingList({
  rows,
  empty,
  onCancel,
}: {
  rows: Booking[]
  empty: string
  onCancel?: (id: number) => void
}) {
  if (rows.length === 0) return <EmptyBlock title="Nothing here" body={empty} />
  return (
    <div className="space-y-3">
      {rows.map((booking) => (
        <article key={booking.id} className="rounded-2xl border border-border/80 bg-card/70 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-2xl">{booking.movieTitle}</h2>
              <p className="text-sm text-muted-foreground">{formatWhen(booking.sessionStartsAt)}</p>
              <p className="mt-1 text-sm">
                Row {booking.rowNumber}, seat {booking.seatNumber}
                {booking.isVip ? " · VIP" : ""} · {formatMoney(booking.finalPrice)}
              </p>
            </div>
            <StatusPill value={booking.status} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" className="h-9" render={<Link href={`/account/bookings/${booking.id}`} />}>
              View pass
            </Button>
            {onCancel && booking.status === "Active" ? (
              <Button variant="ghost" className="h-9 text-destructive" onClick={() => onCancel(booking.id)}>
                Cancel
              </Button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  )
}
