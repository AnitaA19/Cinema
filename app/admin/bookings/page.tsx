import type { Metadata } from "next"
import { AdminBookings } from "@/components/pages/admin-bookings"

export const metadata: Metadata = { title: "Bookings" }

export default function Page() {
  return <AdminBookings />
}
