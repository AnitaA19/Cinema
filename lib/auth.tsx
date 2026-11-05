"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react"
import { toast } from "sonner"
import { ApiError, cinema, setAuthToken, setRefreshHandler, setUnauthorizedHandler } from "@/lib/api"
import type { AcceptInvitationInput, AuthSession, Role } from "@/lib/types"

const STORAGE_KEY = "cinemago.session"
const REFRESH_LOCK = "cinemago.refresh"
const REFRESH_EARLY_MS = 60_000

type AuthContextValue = {
  session: AuthSession | null
  ready: boolean
  login: (usernameOrEmail: string, password: string) => Promise<AuthSession>
  register: (username: string, email: string, password: string) => Promise<AuthSession>
  acceptInvitation: (input: AcceptInvitationInput) => Promise<AuthSession>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const listeners = new Set<() => void>()
let memory: AuthSession | null | undefined
let refreshing: Promise<AuthSession | null> | null = null

function msUntil(value: string | undefined) {
  return value ? new Date(value).getTime() - Date.now() : Number.NEGATIVE_INFINITY
}

function canRefresh(session: AuthSession) {
  return Boolean(session.refreshToken) && msUntil(session.refreshTokenExpiresAtUtc) > 0
}

function readStored(): AuthSession | null {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const session = JSON.parse(raw) as AuthSession
    if (!session.token || !session.expiresAtUtc) throw new Error("Malformed session")
    if (msUntil(session.expiresAtUtc) <= 0 && !canRefresh(session)) throw new Error("Expired session")
    return session
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

function notify() {
  listeners.forEach((listener) => listener())
}

function snapshot() {
  if (memory === undefined) {
    memory = readStored()
    setAuthToken(memory?.token ?? null)
  }
  return memory
}

function writeSession(next: AuthSession | null) {
  memory = next
  setAuthToken(next?.token ?? null)
  if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  else window.localStorage.removeItem(STORAGE_KEY)
  notify()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return
    memory = readStored()
    setAuthToken(memory?.token ?? null)
    listener()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request(REFRESH_LOCK, task) as Promise<T>
  }
  return task()
}

/**
 * Exchanges the stored refresh token for a new session. Refresh tokens rotate on every
 * use, so tabs take turns through a Web Lock and adopt whatever another tab just stored.
 * Resolves to null when the session can no longer be renewed; throws on network errors.
 */
function refreshSession(): Promise<AuthSession | null> {
  const stale = memory?.token
  refreshing ??= withRefreshLock(async () => {
    const latest = readStored()
    if (latest && latest.token !== stale && msUntil(latest.expiresAtUtc) > REFRESH_EARLY_MS) {
      writeSession(latest)
      return latest
    }
    if (!latest || !canRefresh(latest)) return null
    try {
      const next = await cinema.auth.refresh(latest.refreshToken!)
      writeSession(next)
      return next
    } catch (error) {
      if (error instanceof ApiError && error.status !== 0) return null
      throw error
    }
  }).finally(() => {
    refreshing = null
  })
  return refreshing
}

setRefreshHandler(async () => (await refreshSession())?.token ?? null)

function useHasMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const session = useSyncExternalStore(subscribe, snapshot, () => null)
  const ready = useHasMounted()
  const queryClient = useQueryClient()

  const expire = useCallback(() => {
    if (!memory) return
    writeSession(null)
    queryClient.clear()
    toast.message("Your session expired. Sign in again.")
  }, [queryClient])

  useEffect(() => {
    setUnauthorizedHandler(expire)
  }, [expire])

  useEffect(() => {
    if (!session) return
    const delay = Math.min(Math.max(msUntil(session.expiresAtUtc) - REFRESH_EARLY_MS, 0), 2 ** 31 - 1)
    const timer = window.setTimeout(() => {
      refreshSession()
        .then((next) => {
          if (!next) expire()
        })
        .catch(() => {})
    }, delay)
    return () => window.clearTimeout(timer)
  }, [session, expire])

  const login = useCallback(async (usernameOrEmail: string, password: string) => {
    const next = await cinema.auth.login({ usernameOrEmail, password })
    writeSession(next)
    return next
  }, [])

  const register = useCallback(async (username: string, email: string, password: string) => {
    const next = await cinema.auth.register({ username, email, password })
    writeSession(next)
    return next
  }, [])

  const acceptInvitation = useCallback(async (input: AcceptInvitationInput) => {
    const previous = memory?.refreshToken
    const next = await cinema.auth.acceptAdminInvitation(input)
    writeSession(next)
    queryClient.clear()
    if (previous) cinema.auth.logout(previous).catch(() => {})
    return next
  }, [queryClient])

  const logout = useCallback(() => {
    const refreshToken = memory?.refreshToken
    writeSession(null)
    queryClient.clear()
    if (refreshToken) cinema.auth.logout(refreshToken).catch(() => {})
  }, [queryClient])

  const value = useMemo(
    () => ({ session, ready, login, register, acceptInvitation, logout }),
    [session, ready, login, register, acceptInvitation, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error("useAuth must be used inside AuthProvider")
  return value
}

export function isAdmin(role: Role | undefined) {
  return role === "Admin" || role === "SuperAdmin"
}

export function roleLabel(role: Role) {
  return role === "SuperAdmin" ? "Super admin" : role
}

export function homeForRole(role: Role | undefined) {
  return isAdmin(role) ? "/admin" : "/account"
}

function allowed(session: AuthSession, role: Role | undefined) {
  if (role === "SuperAdmin") return session.role === "SuperAdmin"
  if (role === "Admin") return isAdmin(session.role)
  return true
}

export function RequireAuth({
  role,
  children,
}: {
  role?: Role
  children: React.ReactNode
}) {
  const { session, ready } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!ready) return
    if (!session) {
      const next = `${window.location.pathname}${window.location.search}`
      router.replace(`/login?next=${encodeURIComponent(next)}`)
      return
    }
    if (!allowed(session, role)) router.replace(homeForRole(session.role))
  }, [ready, session, role, router])

  if (!ready || !session || !allowed(session, role)) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="h-28 animate-pulse rounded-2xl bg-muted" />
          <div className="h-28 animate-pulse rounded-2xl bg-muted" />
          <div className="h-28 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    )
  }

  return children
}
