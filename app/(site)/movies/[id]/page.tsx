import type { Metadata } from "next"
import { Suspense } from "react"
import { MovieDetailPage } from "@/components/pages/movie-detail-page"

export const metadata: Metadata = { title: "Film" }

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <MovieDetailPage id={Number(id)} />
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-sm text-muted-foreground">Opening film…</div>}>
      <Content params={params} />
    </Suspense>
  )
}
