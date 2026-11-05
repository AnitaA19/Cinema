import { connection } from "next/server"
import { handleDemo } from "@/lib/server/demo"
import { getCinemaMode } from "@/lib/server/mode"
import { proxyToCinema } from "@/lib/server/proxy"

async function dispatch(request: Request, context: { params: Promise<{ path: string[] }> }) {
  await connection()
  const { path } = await context.params
  const pathname = `/${path.join("/")}`
  const mode = await getCinemaMode()
  if (mode === "live") {
    try {
      return await proxyToCinema(request, pathname)
    } catch {
      return Response.json(
        {
          type: "about:blank",
          title: "Bad Gateway",
          status: 502,
          detail: "CinemaGo did not respond. Check that the API is running and CINEMA_API_URL is correct.",
          instance: pathname,
        },
        { status: 502, headers: { "content-type": "application/problem+json", "x-cinema-mode": "live" } },
      )
    }
  }
  return handleDemo(request, pathname)
}

export const GET = dispatch
export const POST = dispatch
export const PUT = dispatch
export const DELETE = dispatch
