import { cinemaApiUrl } from "@/lib/server/mode"

export async function proxyToCinema(request: Request, pathname: string) {
  const incoming = new URL(request.url)
  const headers = new Headers()
  const authorization = request.headers.get("authorization")
  const contentType = request.headers.get("content-type")
  const accept = request.headers.get("accept")
  if (authorization) headers.set("authorization", authorization)
  if (contentType) headers.set("content-type", contentType)
  if (accept) headers.set("accept", accept)

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer()
  }

  const response = await fetch(`${cinemaApiUrl()}${pathname}${incoming.search}`, init)
  const out = new Headers()
  const responseType = response.headers.get("content-type")
  const location = response.headers.get("location")
  if (responseType) out.set("content-type", responseType)
  if (location) out.set("location", location)
  out.set("x-cinema-mode", "live")

  return new Response(response.status === 204 ? null : response.body, {
    status: response.status,
    headers: out,
  })
}
