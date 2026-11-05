import type { SessionStatus } from "@/lib/types"

const TBILISI = "Asia/Tbilisi"

const whenFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TBILISI,
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TBILISI,
  weekday: "long",
  day: "numeric",
  month: "long",
})

const dayKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TBILISI,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

const moneyFormat = new Intl.NumberFormat("en-GE", {
  style: "currency",
  currency: "GEL",
  minimumFractionDigits: 2,
})

export function formatWhen(value: string | Date) {
  return `${whenFormat.format(new Date(value))} Tbilisi`
}

export function formatDay(value: string | Date) {
  return dayFormat.format(new Date(value))
}

export function tbilisiDayKey(value: string | Date) {
  return dayKeyFormat.format(new Date(value))
}

export function formatMoney(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—"
  return moneyFormat.format(value)
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}m`
  if (rest === 0) return `${hours}h`
  return `${hours}h ${rest}m`
}

export function formatAge(age: number) {
  if (age <= 0) return "All ages"
  return `${age}+`
}

export function sessionStatusName(status: SessionStatus) {
  if (status === 1 || status === "Scheduled") return "Scheduled"
  if (status === 2 || status === "Cancelled") return "Cancelled"
  if (status === 3 || status === "Completed") return "Completed"
  return String(status)
}

export function isScheduled(status: SessionStatus) {
  return sessionStatusName(status) === "Scheduled"
}

export function hasStarted(startsAt: string) {
  return new Date(startsAt).getTime() <= Date.now()
}

/** Treat a datetime-local value as Asia/Tbilisi (UTC+4, no daylight saving). */
export function tbilisiLocalToUtcIso(local: string) {
  const normalized = local.length === 16 ? `${local}:00` : local
  const asUtc = new Date(`${normalized}Z`)
  if (Number.isNaN(asUtc.getTime())) return ""
  return new Date(asUtc.getTime() - 4 * 60 * 60 * 1000).toISOString()
}

export function utcToTbilisiInput(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return new Date(date.getTime() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16)
}

export function tbilisiDayStartUtc(date: string) {
  return tbilisiLocalToUtcIso(`${date}T00:00`)
}

export function tbilisiDayEndUtc(date: string) {
  return tbilisiLocalToUtcIso(`${date}T23:59:59`)
}
