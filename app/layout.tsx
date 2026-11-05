import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Fraunces, Outfit } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { Providers } from "@/components/providers"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
})

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
})

export const metadata: Metadata = {
  title: {
    default: "CinemaGo",
    template: "%s · CinemaGo",
  },
  description: "Choose a film, pick a seat, and keep the house running. CinemaGo for guests and the admin desk.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full" suppressHydrationWarning>
        <ThemeProvider attribute="class" forcedTheme="dark" enableSystem={false}>
          <TooltipProvider>
            <Providers>{children}</Providers>
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
