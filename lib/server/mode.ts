import tls from "node:tls"

const DEFAULT_URL = "http://127.0.0.1:5005"

type Cache = { mode: "live" | "demo"; checkedAt: number }

const globalState = globalThis as unknown as { __cinemaMode?: Cache; __cinemaSystemCa?: boolean }

// Node ignores the Windows certificate store, so the ASP.NET dev certificate
// (trusted via `dotnet dev-certs https --trust`) is rejected without this. Node 22.15+ / 24.5+.
const tlsCa = tls as typeof tls & {
  getCACertificates?: (type: "default" | "system") => string[]
  setDefaultCACertificates?: (certs: string[]) => void
}
if (!globalState.__cinemaSystemCa && tlsCa.getCACertificates && tlsCa.setDefaultCACertificates) {
  tlsCa.setDefaultCACertificates([...tlsCa.getCACertificates("default"), ...tlsCa.getCACertificates("system")])
  globalState.__cinemaSystemCa = true
}

export function cinemaApiUrl() {
  return process.env.CINEMA_API_URL?.replace(/\/$/, "") || DEFAULT_URL
}

export function resetCinemaMode() {
  globalState.__cinemaMode = undefined
}

export async function getCinemaMode(): Promise<"live" | "demo"> {
  const forced = process.env.CINEMA_API_MODE
  if (forced === "live" || forced === "demo") return forced

  const cached = globalState.__cinemaMode
  if (cached && Date.now() - cached.checkedAt < 15_000) return cached.mode

  let mode: "live" | "demo" = "demo"
  try {
    const response = await fetch(`${cinemaApiUrl()}/api/genres`, {
      signal: AbortSignal.timeout(800),
      cache: "no-store",
    })
    if (response.status > 0) mode = "live"
  } catch {
    mode = "demo"
  }

  globalState.__cinemaMode = { mode, checkedAt: Date.now() }
  return mode
}
