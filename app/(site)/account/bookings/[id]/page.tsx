import type { Metadata } from "next"
import { Suspense } from "react"
import { PassPage } from "@/components/pages/pass-page"

export const metadata: Metadata = { title: "Pass" }

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <PassPage id={Number(id)} />
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-sm text-muted-foreground">Opening pass…</div>}>
      <Content params={params} />
    </Suspense>
  )
}
