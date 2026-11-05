import type { Metadata } from "next"
import { RequireAuth } from "@/lib/auth"
import { AdminAdmins } from "@/components/pages/admin-admins"

export const metadata: Metadata = { title: "Admins" }

export default function Page() {
  return (
    <RequireAuth role="SuperAdmin">
      <AdminAdmins />
    </RequireAuth>
  )
}
