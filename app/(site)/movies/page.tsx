import type { Metadata } from "next"
import { MoviesPage } from "@/components/pages/movies-page"

export const metadata: Metadata = { title: "Films" }

export default function Page() {
  return <MoviesPage />
}
