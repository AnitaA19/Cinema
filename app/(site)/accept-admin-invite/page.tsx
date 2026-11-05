import type { Metadata } from "next"
import { Suspense } from "react"
import { AcceptInvitePage } from "@/components/pages/auth-pages"

export const metadata: Metadata = { title: "Join as an admin" }

export default function Page() {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-sm text-muted-foreground">Opening invitation…</div>}>
      <AcceptInvitePage />
    </Suspense>
  )
}
