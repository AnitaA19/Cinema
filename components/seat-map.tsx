"use client"

import { cn } from "cn"
import type { SeatAvailability } from "@/lib/types"

export function SeatMap({
  seats,
  selected,
  onToggle,
  disabled,
}: {
  seats: SeatAvailability[]
  selected: number[]
  onToggle?: (seat: SeatAvailability) => void
  disabled?: boolean
}) {
  const rows = [...new Set(seats.map((seat) => seat.rowNumber))].sort((a, b) => a - b)

  return (
    <div className="rounded-3xl border border-border/80 bg-card/70 p-4 sm:p-6">
      <div className="mx-auto mb-6 h-2 max-w-md rounded-full bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_12px_40px_oklch(0.83_0.12_84/0.45)]" />
      <p className="mb-6 text-center text-[11px] tracking-[0.28em] text-muted-foreground uppercase">Screen</p>
      <div className="space-y-2 overflow-x-auto pb-2">
        {rows.map((row) => (
          <div key={row} className="flex items-center justify-center gap-1.5">
            <span className="w-6 shrink-0 text-center text-[11px] text-muted-foreground">{row}</span>
            {seats
              .filter((seat) => seat.rowNumber === row)
              .sort((a, b) => a.seatNumber - b.seatNumber)
              .map((seat) => {
                const isSelected = selected.includes(seat.seatId)
                const taken = !seat.isAvailable
                return (
                  <button
                    key={seat.seatId}
                    type="button"
                    disabled={disabled || taken || !onToggle}
                    aria-pressed={isSelected}
                    aria-label={`Row ${seat.rowNumber}, seat ${seat.seatNumber}${seat.isVip ? ", VIP" : ""}${taken ? ", taken" : ""}`}
                    onClick={() => onToggle?.(seat)}
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-md text-[10px] transition sm:size-8",
                      taken && "cursor-not-allowed bg-muted/40 text-muted-foreground/40",
                      !taken && !isSelected && !seat.isVip && "bg-foreground/10 hover:bg-foreground/20",
                      !taken && !isSelected && seat.isVip && "bg-primary/20 text-primary ring-1 ring-primary/50 hover:bg-primary/30",
                      isSelected && "bg-primary text-primary-foreground",
                    )}
                  >
                    {seat.seatNumber}
                  </button>
                )
              })}
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
        <Legend className="bg-foreground/10" label="Open" />
        <Legend className="bg-primary/30 ring-1 ring-primary/50" label="VIP" />
        <Legend className="bg-primary" label="Selected" />
        <Legend className="bg-muted/50" label="Taken" />
      </div>
    </div>
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
