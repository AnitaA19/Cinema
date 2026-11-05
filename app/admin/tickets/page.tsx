import type { Metadata } from "next"
import { AdminTickets } from "@/components/pages/admin-tickets"

export const metadata: Metadata = { title: "Tickets" }

export default function Page() {
  return <AdminTickets />
}
