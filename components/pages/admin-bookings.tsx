"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { cinema, errorText } from "@/lib/api"
import { formatMoney, formatWhen } from "@/lib/format"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { StatusPill } from "@/components/status-pill"
import { ErrorBlock, EmptyBlock } from "@/components/states"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function AdminBookings() {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<"all" | "Active" | "Cancelled">("all")
  const [cancelId, setCancelId] = useState<number | null>(null)
  const bookings = useQuery({ queryKey: ["bookings", "all"], queryFn: () => cinema.bookings.list() })
  const cancel = useMutation({
    mutationFn: (id: number) => cinema.bookings.cancel(id),
    onSuccess: async () => {
      toast.success("Booking cancelled")
      setCancelId(null)
      await queryClient.invalidateQueries({ queryKey: ["bookings"] })
      await queryClient.invalidateQueries({ queryKey: ["sales"] })
    },
    onError: (error) => toast.error(errorText(error)),
  })

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return (bookings.data ?? [])
      .filter((booking) => status === "all" || booking.status === status)
      .filter((booking) => !needle || booking.movieTitle.toLowerCase().includes(needle) || String(booking.userId).includes(needle) || (booking.ticketCode ?? "").includes(needle))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [bookings.data, query, status])

  return (
    <div>
      <h1 className="font-heading text-4xl">Bookings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Every booking in the house. Cancelling frees the seat for a new sale.</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Input className="h-10" placeholder="Film, user id, or ticket code" value={query} onChange={(event) => setQuery(event.target.value)} />
        <div className="flex gap-2">
          {(["all", "Active", "Cancelled"] as const).map((item) => (
            <button key={item} type="button" onClick={() => setStatus(item)} className={`rounded-full border px-3 py-1 text-sm ${status === item ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>
              {item === "all" ? "All" : item}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6">
        {bookings.isError ? <ErrorBlock error={bookings.error} onRetry={() => bookings.refetch()} /> : null}
        {bookings.data && rows.length === 0 ? <EmptyBlock title="No bookings" body="Nothing matches this filter." /> : null}
        <div className="overflow-x-auto rounded-2xl border border-border/80">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Film</th>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Seat</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((booking) => (
                <tr key={booking.id} className="border-t border-border">
                  <td className="px-4 py-3">{booking.movieTitle}</td>
                  <td className="px-4 py-3">{formatWhen(booking.sessionStartsAt)}</td>
                  <td className="px-4 py-3">R{booking.rowNumber} S{booking.seatNumber}{booking.isVip ? " VIP" : ""}</td>
                  <td className="px-4 py-3">#{booking.userId}</td>
                  <td className="px-4 py-3">{formatMoney(booking.finalPrice)}</td>
                  <td className="px-4 py-3"><StatusPill value={booking.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {booking.status === "Active" ? (
                      <Button variant="ghost" className="h-8 text-destructive" onClick={() => setCancelId(booking.id)}>Cancel</Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmDialog
        open={cancelId != null}
        onOpenChange={(open) => { if (!open) setCancelId(null) }}
        title="Cancel this customer's booking?"
        description="The seat goes back on sale. The ticket record remains."
        confirmLabel="Cancel booking"
        destructive
        pending={cancel.isPending}
        onConfirm={() => { if (cancelId != null) cancel.mutate(cancelId) }}
      />
    </div>
  )
}
