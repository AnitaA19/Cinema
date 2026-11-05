import type { Metadata } from "next"
import { AdminOverview } from "@/components/pages/admin-overview"

export const metadata: Metadata = { title: "Admin desk" }

export default function Page() {
  return <AdminOverview />
}
