import type { ReactNode } from "react"
import { ConnectionBanner } from "@/components/connection-banner"
import { SiteFooter, SiteHeader } from "@/components/site-header"

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <ConnectionBanner />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
