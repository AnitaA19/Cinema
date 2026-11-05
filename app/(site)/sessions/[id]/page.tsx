import type { Metadata } from "next"
import { Suspense } from "react"
import { SessionPage } from "@/components/pages/session-page"

export const metadata: Metadata = { title: "Seats" }

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <SessionPage id={Number(id)} />
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-sm text-muted-foreground">Opening seats…</div>}>
      <Content params={params} />
    </Suspense>
  )
}
