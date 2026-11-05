import type { Metadata } from "next"
import { AdminHalls } from "@/components/pages/admin-halls"

export const metadata: Metadata = { title: "Halls" }

export default function Page() {
  return <AdminHalls />
}
