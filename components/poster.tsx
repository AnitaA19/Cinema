"use client"

import { useState } from "react"
import { cn } from "cn"

const palettes = [
  ["oklch(0.42 0.09 55)", "oklch(0.22 0.04 40)"],
  ["oklch(0.38 0.08 250)", "oklch(0.18 0.04 260)"],
  ["oklch(0.4 0.1 25)", "oklch(0.18 0.04 20)"],
  ["oklch(0.42 0.08 145)", "oklch(0.18 0.03 160)"],
  ["oklch(0.45 0.1 85)", "oklch(0.2 0.04 70)"],
  ["oklch(0.36 0.07 310)", "oklch(0.16 0.04 300)"],
]

function hash(title: string) {
  return [...title].reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

export function Poster({
  title,
  src,
  className,
  eyebrow,
}: {
  title: string
  src?: string | null
  className?: string
  eyebrow?: string
}) {
  const [failed, setFailed] = useState(false)
  const [from, to] = palettes[hash(title) % palettes.length]
  const mark = title
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()

  return (
    <div
      className={cn("relative overflow-hidden bg-card", className)}
      style={{ backgroundImage: `linear-gradient(165deg, ${from}, ${to} 70%)` }}
      aria-hidden={!src || failed}
    >
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`Poster for ${title}`} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(1_0_0/0.18),transparent_42%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />
      {!src || failed ? <div className="absolute top-3 left-3 font-heading text-3xl text-white/90">{mark}</div> : null}
      {eyebrow ? (
        <div className="absolute right-3 bottom-3 left-3 text-[11px] tracking-[0.18em] text-white/75 uppercase">
          {eyebrow}
        </div>
      ) : null}
    </div>
  )
}
