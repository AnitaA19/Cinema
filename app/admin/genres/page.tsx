import type { Metadata } from "next"
import { AdminGenres } from "@/components/pages/admin-genres"

export const metadata: Metadata = { title: "Genres" }

export default function Page() {
  return <AdminGenres />
}
