"use client"

import { Suspense } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Armchair,
  CalendarClock,
  Clapperboard,
  LayoutDashboard,
  Menu,
  QrCode,
  ShieldCheck,
  Tags,
  Ticket,
} from "lucide-react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { roleLabel, useAuth } from "@/lib/auth"
import { cn } from "cn"

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/movies", label: "Movies", icon: Clapperboard },
  { href: "/admin/genres", label: "Genres", icon: Tags },
  { href: "/admin/halls", label: "Halls", icon: Armchair },
  { href: "/admin/sessions", label: "Sessions", icon: CalendarClock },
  { href: "/admin/bookings", label: "Bookings", icon: Ticket },
  { href: "/admin/tickets", label: "Tickets", icon: QrCode },
  { href: "/admin/admins", label: "Admins", icon: ShieldCheck, superAdminOnly: true },
]

function NavList({ pathname, onNavigate }: { pathname: string | null; onNavigate?: () => void }) {
  const { session } = useAuth()
  const visible = items.filter((item) => !item.superAdminOnly || session?.role === "SuperAdmin")
  return (
    <nav className="flex flex-col gap-1">
      {visible.map((item) => {
        const active =
          pathname !== null && (item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href))
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground",
              active && "bg-primary/15 text-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function ActiveNavList({ onNavigate }: { onNavigate?: () => void }) {
  return <NavList pathname={usePathname()} onNavigate={onNavigate} />
}

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Suspense fallback={<NavList pathname={null} onNavigate={onNavigate} />}>
      <ActiveNavList onNavigate={onNavigate} />
    </Suspense>
  )
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { session, logout } = useAuth()
  const router = useRouter()

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-border/70 bg-sidebar/80 md:flex md:flex-col md:px-3 md:py-5">
        <Link href="/" className="px-2">
          <Logo />
        </Link>
        <p className="mt-6 px-3 text-[11px] tracking-[0.18em] text-muted-foreground uppercase">Admin desk</p>
        <div className="mt-3">
          <Nav />
        </div>
        <div className="mt-auto px-2 pt-6">
          <p className="truncate text-sm font-medium">{session?.username}</p>
          <p className="truncate text-xs text-muted-foreground">{session?.email}</p>
          {session ? (
            <span className="mt-2 inline-flex rounded-full bg-primary/15 px-2 py-0.5 text-[11px] text-primary">
              {roleLabel(session.role)}
            </span>
          ) : null}
          <div className="mt-3 flex gap-2">
            <Button variant="outline" className="h-8" render={<Link href="/" />}>
              Programme
            </Button>
            <Button
              variant="ghost"
              className="h-8"
              onClick={() => {
                logout()
                router.push("/")
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 md:hidden">
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open admin menu" />}>
              <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle>Admin desk</SheetTitle>
              </SheetHeader>
              <div className="px-4">
                <Nav />
              </div>
            </SheetContent>
          </Sheet>
          <Logo />
          <Button variant="outline" className="h-8" render={<Link href="/" />}>
            Programme
          </Button>
        </div>
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </div>
    </div>
  )
}
