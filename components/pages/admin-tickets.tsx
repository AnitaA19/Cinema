"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { QRCodeSVG } from "qrcode.react"
import { cinema, errorText } from "@/lib/api"
import { formatMoney, formatWhen } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Ticket } from "@/lib/types"

export function AdminTickets() {
  const [id, setId] = useState("")
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [message, setMessage] = useState("")
  const lookup = useMutation({
    mutationFn: () => cinema.tickets.get(Number(id)),
    onSuccess: (found) => {
      setTicket(found)
      setMessage("")
    },
    onError: (error) => {
      setTicket(null)
      setMessage(errorText(error))
    },
  })

  return (
    <div>
      <h1 className="font-heading text-4xl">Tickets</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        CinemaGo looks up a ticket by its numeric id. Customers see the ticket code on their pass; an admin can open any ticket.
      </p>
      <form
        className="mt-6 flex max-w-md flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault()
          lookup.mutate()
        }}
      >
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="ticket-id">Ticket id</Label>
          <Input id="ticket-id" className="h-10" inputMode="numeric" value={id} onChange={(event) => setId(event.target.value)} required />
        </div>
        <Button type="submit" className="h-10" disabled={lookup.isPending}>{lookup.isPending ? "Looking…" : "Look up"}</Button>
      </form>
      {message ? <p className="mt-4 text-sm text-destructive">{message}</p> : null}
      {ticket ? (
        <article className="mt-6 grid max-w-xl gap-4 rounded-3xl border border-border/80 bg-card/80 p-5 sm:grid-cols-[1fr_auto]">
          <div>
            <h2 className="font-heading text-3xl">{ticket.movieTitle}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{formatWhen(ticket.sessionStartsAt)} · {ticket.hallName}</p>
            <p className="mt-1 text-sm">Row {ticket.rowNumber}, seat {ticket.seatNumber}{ticket.isVip ? " · VIP" : ""}</p>
            <p className="mt-1 text-sm">{formatMoney(ticket.finalPrice)} · booking #{ticket.bookingId}</p>
            <p className="mt-3 font-mono text-xs break-all text-muted-foreground">{ticket.ticketCode}</p>
          </div>
          <div className="rounded-2xl bg-[#241e18] p-3">
            <QRCodeSVG value={ticket.ticketCode} size={140} bgColor="#241e18" fgColor="#f4ead6" />
          </div>
        </article>
      ) : null}
    </div>
  )
}
