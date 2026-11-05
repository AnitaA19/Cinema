import type { Metadata } from "next"
import { AdminMovies } from "@/components/pages/admin-movies"

export const metadata: Metadata = { title: "Movies" }

export default function Page() {
  return <AdminMovies />
}
