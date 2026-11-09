"use client"

import { Suspense } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu } from "lucide-react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { homeForRole, isAdmin, roleLabel, useAuth } from "@/lib/auth"
import { cn } from "cn"

const links = [
  { href: "/", label: "Tonight" },
  { href: "/movies", label: "Films" },
  { href: "/schedule", label: "Schedule" },
]

function NavLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav className="ml-4 hidden items-center gap-1 md:flex">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted/70 hover:text-foreground",
            pathname === link.href && "bg-muted text-foreground",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}

function ActiveNavLinks() {
  return <NavLinks pathname={usePathname()} />
}

export function SiteHeader() {
  const router = useRouter()
  const { session, ready, logout } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>
        <Suspense fallback={<NavLinks pathname={null} />}>
          <ActiveNavLinks />
        </Suspense>
        <div className="ml-auto flex items-center gap-2">
          {ready && isAdmin(session?.role) ? (
            <Button render={<Link href="/admin" />} variant="outline" className="hidden h-9 sm:inline-flex">
              Admin desk
            </Button>
          ) : null}
          {!ready ? (
            <div className="h-9 w-24 animate-pulse rounded-lg bg-muted/70" aria-hidden />
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="secondary" className="h-9 max-w-40 px-3">
                    <span className="truncate">{session.username}</span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <span className="block">{session.username}</span>
                    <span className="block font-normal text-muted-foreground">{roleLabel(session.role)}</span>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push(homeForRole(session.role))}>
                  {isAdmin(session.role) ? "Admin desk" : "My tickets"}
                </DropdownMenuItem>
                {isAdmin(session.role) ? (
                  <DropdownMenuItem onClick={() => router.push("/account")}>My tickets</DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  onClick={() => {
                    logout()
                    router.push("/")
                  }}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button render={<Link href="/login" />} className="h-9 px-3">
              Sign in
            </Button>
          )}
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" />}>
              <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 px-4">
                {links.map((link) => (
                  <Link key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-sm transition hover:bg-muted">
                    {link.label}
                  </Link>
                ))}
                {session ? (
                  <Link href={homeForRole(session.role)} className="rounded-lg px-3 py-2 text-sm transition hover:bg-muted">
                    {isAdmin(session.role) ? "Admin desk" : "My tickets"}
                  </Link>
                ) : (
                  <Link href="/register" className="rounded-lg px-3 py-2 text-sm transition hover:bg-muted">
                    Create an account
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>CinemaGo · seats, sessions, and tickets from your API.</p>
        <p>Times shown in Tbilisi (UTC+4). Prices in lari.</p>
      </div>
    </footer>
  )
}
