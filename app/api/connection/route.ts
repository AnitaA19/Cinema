import { connection } from "next/server"
import { cinemaApiUrl, getCinemaMode, resetCinemaMode } from "@/lib/server/mode"

export async function GET() {
  await connection()
  return Response.json({ mode: await getCinemaMode(), apiUrl: cinemaApiUrl() })
}

export async function POST() {
  await connection()
  resetCinemaMode()
  return Response.json({ mode: await getCinemaMode(), apiUrl: cinemaApiUrl() })
}
