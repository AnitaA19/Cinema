"use client"

import { ConnectionBanner } from "@/components/connection-banner"
import { AdminShell } from "@/components/admin-shell"
import { RequireAuth } from "@/lib/auth"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth role="Admin">
      <ConnectionBanner />
      <AdminShell>{children}</AdminShell>
    </RequireAuth>
  )
}
