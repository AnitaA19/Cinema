import type { Metadata } from "next"
import { AdminSessions } from "@/components/pages/admin-sessions"

export const metadata: Metadata = { title: "Sessions" }

export default function Page() {
  return <AdminSessions />
}
