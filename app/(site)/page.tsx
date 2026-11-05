import type { Metadata } from "next"
import { HomePage } from "@/components/pages/home-page"

export const metadata: Metadata = { title: "Tonight" }

export default function Page() {
  return <HomePage />
}
