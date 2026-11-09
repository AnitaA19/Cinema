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
                      "grid size-7 shrink-0 place-items-center rounded-md text-[10px] font-medium transition duration-150 sm:size-8",
                      taken && "cursor-not-allowed bg-muted/30 text-muted-foreground/35 line-through decoration-muted-foreground/40",
                      !taken && onToggle && !disabled && "cursor-pointer hover:scale-105 active:scale-95",
                      !taken && !isSelected && !seat.isVip && "bg-foreground/12 text-foreground/85 hover:bg-foreground/22",
                      !taken && !isSelected && seat.isVip && "bg-primary/18 text-primary ring-1 ring-primary/55 hover:bg-primary/28",
                      isSelected && "bg-primary text-primary-foreground shadow-[0_0_0_2px_oklch(0.83_0.12_84/0.35)] hover:bg-primary",
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
        <Legend className="bg-foreground/15" label="Open" />
        <Legend className="bg-primary/25 ring-1 ring-primary/55" label="VIP" />
        <Legend className="bg-primary" label="Selected" />
        <Legend className="bg-muted/40 opacity-70" label="Taken" />
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
