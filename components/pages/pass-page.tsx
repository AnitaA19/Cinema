"use client"

import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"
import { useQuery } from "@tanstack/react-query"
import { cinema } from "@/lib/api"
import { RequireAuth } from "@/lib/auth"
import { formatMoney, formatWhen } from "@/lib/format"
import { StatusPill } from "@/components/status-pill"
import { ErrorBlock } from "@/components/states"
import { Button } from "@/components/ui/button"

export function PassPage({ id }: { id: number }) {
  return (
    <RequireAuth>
      <PassBody id={id} />
    </RequireAuth>
  )
}

function PassBody({ id }: { id: number }) {
  const booking = useQuery({ queryKey: ["booking", id], queryFn: () => cinema.bookings.get(id) })
  const screening = useQuery({
    queryKey: ["session", booking.data?.sessionId],
    queryFn: () => cinema.sessions.get(booking.data!.sessionId),
    enabled: Boolean(booking.data?.sessionId),
  })

  if (booking.isLoading) return <p className="px-4 py-16 text-sm text-muted-foreground">Opening your pass…</p>
  if (booking.isError) return <div className="mx-auto max-w-xl px-4 py-10"><ErrorBlock error={booking.error} /></div>
  if (!booking.data) return null
  const pass = booking.data

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Button variant="ghost" className="mb-4 h-8 px-0" render={<Link href="/account" />}>Back to my tickets</Button>
      <article className="overflow-hidden rounded-3xl border border-primary/30 bg-card">
        <div className="bg-primary/15 px-6 py-5">
          <p className="text-xs tracking-[0.22em] uppercase">CinemaGo pass</p>
          <h1 className="mt-1 font-heading text-4xl">{pass.movieTitle}</h1>
        </div>
        <div className="grid gap-6 px-6 py-6 sm:grid-cols-[1fr_auto]">
          <dl className="space-y-3 text-sm">
            <Row label="When" value={formatWhen(pass.sessionStartsAt)} />
            <Row label="Hall" value={screening.data?.hallName ?? "—"} />
            <Row label="Seat" value={`Row ${pass.rowNumber}, seat ${pass.seatNumber}${pass.isVip ? " · VIP" : ""}`} />
            <Row label="Price" value={formatMoney(pass.finalPrice)} />
            <div className="flex items-center gap-2"><dt className="text-muted-foreground">Status</dt><StatusPill value={pass.status} /></div>
          </dl>
          {pass.ticketCode && pass.status === "Active" ? (
            <div className="rounded-2xl bg-[#241e18] p-3">
              <QRCodeSVG value={pass.ticketCode} size={148} bgColor="#241e18" fgColor="#f4ead6" />
            </div>
          ) : null}
        </div>
        {pass.ticketCode ? (
          <p className="border-t border-border px-6 py-4 font-mono text-xs break-all text-muted-foreground">{pass.ticketCode}</p>
        ) : null}
      </article>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
