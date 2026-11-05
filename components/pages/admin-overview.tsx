"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { cinema } from "@/lib/api"
import { formatMoney, formatWhen, hasStarted, isScheduled } from "@/lib/format"
import { ErrorBlock } from "@/components/states"
import { Button } from "@/components/ui/button"

export function AdminOverview() {
  const movies = useQuery({ queryKey: ["movies", "count"], queryFn: () => cinema.movies.list({ page: 1, pageSize: 1 }) })
  const halls = useQuery({ queryKey: ["halls"], queryFn: () => cinema.halls.list() })
  const sessions = useQuery({ queryKey: ["sessions", "desk"], queryFn: () => cinema.sessions.list({ page: 1, pageSize: 100 }) })
  const bookings = useQuery({ queryKey: ["bookings", "all"], queryFn: () => cinema.bookings.list() })
  const sales = useQuery({ queryKey: ["sales"], queryFn: () => cinema.movies.sales() })

  const error = movies.error || halls.error || sessions.error || bookings.error || sales.error
  if (error) return <ErrorBlock error={error} onRetry={() => { movies.refetch(); halls.refetch(); sessions.refetch(); bookings.refetch(); sales.refetch() }} />

  const upcoming = (sessions.data?.sessions ?? []).filter((session) => isScheduled(session.status) && !hasStarted(session.startsAt)).length
  const activeBookings = (bookings.data ?? []).filter((booking) => booking.status === "Active").length
  const maxRevenue = Math.max(...(sales.data ?? []).map((row) => row.revenue), 1)

  return (
    <div>
      <p className="text-xs tracking-[0.22em] text-primary uppercase">Admin desk</p>
      <h1 className="mt-2 font-heading text-4xl">House overview</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Sales count active tickets only. Cancelled bookings stay out of the revenue total.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Films" value={movies.data?.totalCount} />
        <Stat label="Halls" value={halls.data?.length} />
        <Stat label="Upcoming sessions" value={sessions.isLoading ? undefined : upcoming} />
        <Stat label="Active bookings" value={bookings.isLoading ? undefined : activeBookings} />
      </div>
      <section className="mt-8 rounded-3xl border border-border/80 bg-card/70 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-2xl">Revenue by film</h2>
          <Button variant="outline" className="h-8" render={<Link href="/admin/movies" />}>Manage films</Button>
        </div>
        {sales.isLoading ? <p className="mt-4 text-sm text-muted-foreground">Adding up tickets…</p> : null}
        {(sales.data ?? []).length === 0 && !sales.isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">No active tickets yet.</p>
        ) : null}
        <ul className="mt-4 space-y-3">
          {(sales.data ?? []).map((row) => (
            <li key={row.movieId}>
              <div className="flex justify-between text-sm">
                <span>{row.title}</span>
                <span>{row.ticketCount} tickets · {formatMoney(row.revenue)}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(8, (row.revenue / maxRevenue) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-6">
        <h2 className="font-heading text-2xl">Latest bookings</h2>
        <div className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border/80">
          {(bookings.data ?? []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6).map((booking) => (
            <div key={booking.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <span>{booking.movieTitle} · row {booking.rowNumber} seat {booking.seatNumber}</span>
              <span className="text-muted-foreground">{formatWhen(booking.sessionStartsAt)} · {booking.status}</span>
            </div>
          ))}
          {bookings.data && bookings.data.length === 0 ? <p className="px-4 py-6 text-sm text-muted-foreground">No bookings yet.</p> : null}
        </div>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card/70 p-4">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 font-heading text-4xl">{value ?? "—"}</p>
    </div>
  )
}
