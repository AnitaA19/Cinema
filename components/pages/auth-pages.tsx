"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { ApiError, cinema, errorText } from "@/lib/api"
import { homeForRole, useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next") || ""
  const [usernameOrEmail, setUsernameOrEmail] = useState("")
  const [password, setPassword] = useState("")
  const [pending, setPending] = useState(false)
  const connection = useQuery({ queryKey: ["connection"], queryFn: () => cinema.connection.get() })

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    try {
      const session = await login(usernameOrEmail, password)
      toast.success(`Welcome back, ${session.username}`)
      router.push(safeNext(next) || homeForRole(session.role))
    } catch (error) {
      toast.error(errorText(error))
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthFrame
      title="Sign in"
      lede="Use the username or email on your CinemaGo account."
      footer={<>New here? <Link className="text-primary" href="/register">Create an account</Link></>}
    >
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Username or email" value={usernameOrEmail} onChange={setUsernameOrEmail} autoComplete="username" />
        <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
        <Button type="submit" className="h-11 w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</Button>
      </form>
      {connection.data?.mode === "demo" ? (
        <div className="mt-6 space-y-2 rounded-2xl border border-border bg-muted/30 p-3 text-sm">
          <p className="text-muted-foreground">Preview accounts, only while the API is offline:</p>
          <Credential label="Super admin" username="owner" password="CinemaOwner!12" onUse={(user, pass) => { setUsernameOrEmail(user); setPassword(pass) }} />
          <Credential label="Admin" username="admin" password="CinemaAdmin!12" onUse={(user, pass) => { setUsernameOrEmail(user); setPassword(pass) }} />
          <Credential label="Customer" username="lea" password="tickets123" onUse={(user, pass) => { setUsernameOrEmail(user); setPassword(pass) }} />
        </div>
      ) : null}
    </AuthFrame>
  )
}

export function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [pending, setPending] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    try {
      const session = await register(username, email, password)
      toast.success("Account created")
      router.push(homeForRole(session.role))
    } catch (error) {
      toast.error(errorText(error))
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthFrame
      title="Create an account"
      lede="Registration always creates a customer. Admin access is issued by CinemaGo, not this form."
      footer={<>Already booked with us? <Link className="text-primary" href="/login">Sign in</Link></>}
    >
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Username" value={username} onChange={setUsername} autoComplete="username" hint="3–100 letters, digits, . _ -" />
        <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" hint="At least 8 characters" />
        <Button type="submit" className="h-11 w-full" disabled={pending}>{pending ? "Creating…" : "Create account"}</Button>
      </form>
    </AuthFrame>
  )
}

export function AcceptInvitePage() {
  const { acceptInvitation } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const invitedEmail = params.get("email") ?? ""
  const [email, setEmail] = useState(invitedEmail)
  const [code, setCode] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [pending, setPending] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    try {
      const session = await acceptInvitation({ email: email.trim(), code, username: username.trim(), password })
      toast.success(`Welcome to the admin desk, ${session.username}`)
      router.push(homeForRole(session.role))
    } catch (error) {
      toast.error(
        error instanceof ApiError && error.status === 401
          ? "That code is wrong or has expired. Ask the super admin to send a new invitation."
          : errorText(error),
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthFrame
      title="Join as an admin"
      lede="Enter the 8-digit code from your invitation email, then choose how you will sign in."
      footer={<>Already set up? <Link className="text-primary" href="/login">Sign in</Link></>}
    >
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" readOnly={Boolean(invitedEmail)} />
        <div className="space-y-1.5">
          <Label htmlFor="invite-code">Invitation code</Label>
          <Input
            id="invite-code"
            className="h-12 text-center font-mono text-xl tracking-[0.5em]"
            value={code}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{8}"
            maxLength={8}
            placeholder="••••••••"
            title="8 digits"
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))}
            required
          />
          <p className="text-xs text-muted-foreground">The code expires a few minutes after it was sent.</p>
        </div>
        <Field label="Username" value={username} onChange={setUsername} autoComplete="username" hint="3–100 letters, digits, . _ -" />
        <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" hint="At least 8 characters" />
        <Button type="submit" className="h-11 w-full" disabled={pending || code.length !== 8}>
          {pending ? "Joining…" : "Create admin account"}
        </Button>
      </form>
    </AuthFrame>
  )
}

function AuthFrame({
  title,
  lede,
  footer,
  children,
}: {
  title: string
  lede: string
  footer: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-2">
      <div className="hidden lg:block">
        <p className="text-xs tracking-[0.28em] text-primary uppercase">CinemaGo</p>
        <h2 className="mt-3 font-heading text-6xl leading-[0.95]">The lights go down. Your seat stays yours.</h2>
      </div>
      <div className="rounded-3xl border border-border/80 bg-card/80 p-6 sm:p-8">
        <h1 className="font-heading text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{lede}</p>
        <div className="mt-6">{children}</div>
        <p className="mt-6 text-sm text-muted-foreground">{footer}</p>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  hint,
  readOnly,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  autoComplete?: string
  hint?: string
  readOnly?: boolean
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-")
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        className={readOnly ? "h-10 bg-muted/40 text-muted-foreground" : "h-10"}
        type={type}
        value={value}
        autoComplete={autoComplete}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
        required
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function Credential({
  label,
  username,
  password,
  onUse,
}: {
  label: string
  username: string
  password: string
  onUse: (username: string, password: string) => void
}) {
  return (
    <button type="button" className="flex w-full items-center justify-between rounded-xl px-2 py-1 text-left hover:bg-muted" onClick={() => onUse(username, password)}>
      <span>{label} · {username}</span>
      <span className="text-xs text-primary">Use</span>
    </button>
  )
}

function safeNext(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return ""
  return value
}
