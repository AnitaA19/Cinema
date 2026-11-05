import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-start justify-center px-4">
      <p className="text-xs tracking-[0.22em] text-primary uppercase">404</p>
      <h1 className="mt-2 font-heading text-5xl">That reel is missing</h1>
      <p className="mt-3 text-muted-foreground">The page is not part of CinemaGo.</p>
      <Button className="mt-6 h-10 px-4" render={<Link href="/" />}>Back to tonight</Button>
    </div>
  )
}
