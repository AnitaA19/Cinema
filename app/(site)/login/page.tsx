import type { Metadata } from "next"
import { Suspense } from "react"
import { LoginPage } from "@/components/pages/auth-pages"

export const metadata: Metadata = { title: "Sign in" }

export default function Page() {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-sm text-muted-foreground">Opening sign in…</div>}>
      <LoginPage />
    </Suspense>
  )
}
