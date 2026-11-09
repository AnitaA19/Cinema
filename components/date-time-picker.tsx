"use client"

import { useState } from "react"
import { CalendarDays, ChevronLeft, ChevronRight, Clock, X } from "lucide-react"
import { cn } from "cn"
import { tbilisiDayKey } from "@/lib/format"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
const HOURS = Array.from({ length: 24 }, (_, hour) => hour)
const MINUTES = Array.from({ length: 12 }, (_, step) => step * 5)
const SHOWTIMES = ["12:00", "15:00", "18:00", "21:00"]

const monthLabel = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", month: "long", year: "numeric" })
const dayLabel = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short", year: "numeric" })

const triggerClass =
  "flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg border border-input bg-transparent px-3 text-left text-sm transition-colors outline-none hover:bg-input/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:border-ring dark:bg-input/30"

const pad = (value: number) => String(value).padStart(2, "0")
const dayKey = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`

function parseDay(key: string) {
  const [year, month, day] = key.split("-").map(Number)
  return { year, month: month - 1, day }
}

function formatDayKey(key: string) {
  const { year, month, day } = parseDay(key)
  return dayLabel.format(new Date(Date.UTC(year, month, day)))
}

function Calendar({ value, min, onSelect }: { value: string; min?: string; onSelect: (key: string) => void }) {
  const today = tbilisiDayKey(new Date())
  const start = parseDay(value || today)
  const [view, setView] = useState({ year: start.year, month: start.month })

  const first = new Date(Date.UTC(view.year, view.month, 1))
  const lead = (first.getUTCDay() + 6) % 7
  const cells = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(Date.UTC(view.year, view.month, index - lead + 1))
    return {
      key: dayKey(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === view.month,
    }
  })

  function shift(delta: number) {
    const next = new Date(Date.UTC(view.year, view.month + delta, 1))
    setView({ year: next.getUTCFullYear(), month: next.getUTCMonth() })
  }

  return (
    <div className="w-[17.5rem]">
      <div className="mb-3 flex items-center justify-between">
        <p className="pl-1 font-heading text-lg">{monthLabel.format(first)}</p>
        <div className="flex gap-1">
          <IconButton label="Previous month" onClick={() => shift(-1)}><ChevronLeft className="size-4" /></IconButton>
          <IconButton label="Next month" onClick={() => shift(1)}><ChevronRight className="size-4" /></IconButton>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] tracking-wider text-muted-foreground uppercase">
        {WEEKDAYS.map((weekday) => <span key={weekday} className="py-1">{weekday}</span>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const selected = cell.key === value
          const disabled = min !== undefined && cell.key < min
          return (
            <button
              key={cell.key}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              aria-label={formatDayKey(cell.key)}
              onClick={() => onSelect(cell.key)}
              className={cn(
                "grid aspect-square place-items-center rounded-lg text-sm transition",
                cell.inMonth ? "text-foreground" : "text-muted-foreground/50",
                !selected && !disabled && "cursor-pointer hover:bg-muted",
                cell.key === today && !selected && "ring-1 ring-primary/60 text-primary",
                selected && "bg-primary font-medium text-primary-foreground",
                disabled && "cursor-not-allowed opacity-30",
              )}
            >
              {cell.day}
            </button>
          )
        })}
      </div>
      <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm">
        <button
          type="button"
          className="cursor-pointer rounded-md px-2 py-1 text-primary hover:bg-muted"
          onClick={() => {
            const now = parseDay(today)
            setView({ year: now.year, month: now.month })
            if (min === undefined || today >= min) onSelect(today)
          }}
        >
          Today
        </button>
      </div>
    </div>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-8 cursor-pointer place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  )
}

export function DatePicker({
  id,
  value,
  onChange,
  min,
  placeholder = "Pick a date",
  clearable = false,
  className,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  min?: string
  placeholder?: string
  clearable?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger id={id} className={cn(triggerClass, clearable && value && "pr-9")}>
          <CalendarDays className="size-4 shrink-0 text-primary" />
          <span className={cn("truncate", !value && "text-muted-foreground")}>{value ? formatDayKey(value) : placeholder}</span>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar
            value={value}
            min={min}
            onSelect={(key) => {
              onChange(key)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
      {clearable && value ? (
        <button
          type="button"
          aria-label="Clear date"
          onClick={() => onChange("")}
          className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  )
}

export function TimePicker({ id, value, onChange }: { id?: string; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const [hour, minute] = value ? value.split(":").map(Number) : [undefined, undefined]

  function pick(nextHour: number | undefined, nextMinute: number | undefined, close: boolean) {
    onChange(`${pad(nextHour ?? 19)}:${pad(nextMinute ?? 0)}`)
    if (close) setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger id={id} className={triggerClass}>
        <Clock className="size-4 shrink-0 text-primary" />
        <span className={cn("tabular-nums", !value && "text-muted-foreground")}>{value || "Pick a time"}</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[17.5rem]">
        <p className="text-[11px] tracking-wider text-muted-foreground uppercase">Showtimes</p>
        <div className="mt-2 grid grid-cols-4 gap-1">
          {SHOWTIMES.map((time) => (
            <Chip key={time} active={value === time} onClick={() => { onChange(time); setOpen(false) }}>{time}</Chip>
          ))}
        </div>
        <p className="mt-3 text-[11px] tracking-wider text-muted-foreground uppercase">Hour</p>
        <div className="mt-2 grid grid-cols-6 gap-1">
          {HOURS.map((option) => (
            <Chip key={option} active={hour === option} onClick={() => pick(option, minute, false)}>{pad(option)}</Chip>
          ))}
        </div>
        <p className="mt-3 text-[11px] tracking-wider text-muted-foreground uppercase">Minute</p>
        <div className="mt-2 grid grid-cols-6 gap-1">
          {MINUTES.map((option) => (
            <Chip key={option} active={minute === option} onClick={() => pick(hour, option, true)}>:{pad(option)}</Chip>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-8 cursor-pointer rounded-lg text-sm tabular-nums transition",
        active ? "bg-primary font-medium text-primary-foreground" : "bg-foreground/5 hover:bg-foreground/10",
      )}
    >
      {children}
    </button>
  )
}

/** Value is a Tbilisi wall-clock string, `YYYY-MM-DDTHH:mm`, or "" until both parts are chosen. */
export function DateTimePicker({
  id,
  value,
  onChange,
  min,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  min?: string
}) {
  const [parts, setParts] = useState({ date: value.slice(0, 10), time: value.slice(11, 16) })

  function update(next: { date: string; time: string }) {
    setParts(next)
    onChange(next.date && next.time ? `${next.date}T${next.time}` : "")
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_8.5rem] gap-2">
      <DatePicker id={id} value={parts.date} min={min} onChange={(date) => update({ ...parts, date })} />
      <TimePicker value={parts.time} onChange={(time) => update({ ...parts, time })} />
    </div>
  )
}
