import type { Metadata } from "next"
import { Suspense } from "react"
import { AdminSeats } from "@/components/pages/admin-seats"

export const metadata: Metadata = { title: "Seats" }

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AdminSeats hallId={Number(id)} />
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Opening seat map…</div>}>
      <Content params={params} />
    </Suspense>
  )
}
