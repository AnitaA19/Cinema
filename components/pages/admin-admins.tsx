"use client"

import { useEffect, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Clock, MailCheck, RotateCw } from "lucide-react"
import { toast } from "sonner"
import { ApiError, cinema, errorText } from "@/lib/api"
import type { AdminInvitation } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "cn"

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [active])
  return now
}

function remaining(expiresAtUtc: string, now: number) {
  const ms = new Date(expiresAtUtc).getTime() - now
  if (ms <= 0) return null
  const minutes = Math.floor(ms / 60_000)
  const seconds = Math.floor((ms % 60_000) / 1000)
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

export function AdminAdmins() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState<AdminInvitation[]>([])
  const now = useNow(sent.length > 0)

  const invite = useMutation({
    mutationFn: (address: string) => cinema.auth.inviteAdmin(address),
    onSuccess: (invitation) => {
      setSent((list) => [invitation, ...list.filter((item) => item.email !== invitation.email)])
      setEmail("")
      toast.success(`Invitation sent to ${invitation.email}`)
    },
    onError: (error) => toast.error(inviteError(error)),
  })

  return (
    <div>
      <h1 className="font-heading text-4xl">Admins</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Invite a new admin by email. They get a one-time code and a link, then choose their own username and password.
        Only the super admin can send invitations.
      </p>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form
          className="rounded-3xl border border-border/80 bg-card/60 p-5 sm:p-6"
          onSubmit={(event) => {
            event.preventDefault()
            invite.mutate(email.trim())
          }}
        >
          <h2 className="font-medium">Invite an admin</h2>
          <div className="mt-4 space-y-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="invite-email"
                className="h-10"
                type="email"
                value={email}
                maxLength={256}
                autoComplete="off"
                placeholder="name@example.com"
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <Button type="submit" className="h-10 shrink-0 px-4" disabled={invite.isPending}>
                {invite.isPending ? "Sending…" : "Send invitation"}
              </Button>
            </div>
          </div>
          <ul className="mt-5 space-y-1.5 text-xs text-muted-foreground">
            <li>The code expires after a few minutes (10 by default) and allows 5 wrong attempts.</li>
            <li>Inviting the same email again cancels the previous code and sends a new one.</li>
            <li>An email that already belongs to an account cannot be invited.</li>
          </ul>
        </form>

        <aside className="rounded-3xl border border-border/80 bg-card/60 p-5">
          <h2 className="font-medium">Sent this visit</h2>
          {sent.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Invitations you send appear here with their time left.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {sent.map((invitation) => {
                const left = remaining(invitation.expiresAtUtc, now)
                return (
                  <li key={invitation.invitationId} className="rounded-2xl border border-border/70 px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-full",
                          left ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {left ? <MailCheck className="size-4" /> : <Clock className="size-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{invitation.email}</p>
                        <p className="text-xs text-muted-foreground">{left ? `Expires in ${left}` : "Expired"}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label={`Resend invitation to ${invitation.email}`}
                        title="Resend"
                        disabled={invite.isPending}
                        onClick={() => invite.mutate(invitation.email)}
                      >
                        <RotateCw className="size-4" />
                      </Button>
                    </div>
                    {invitation.code && left ? (
                      <p className="mt-2 rounded-lg bg-muted/60 px-2 py-1 text-xs text-muted-foreground">
                        Preview mode, no email sent. Code: <span className="font-mono text-foreground">{invitation.code}</span>
                      </p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </aside>
      </div>
    </div>
  )
}

function inviteError(error: unknown) {
  if (error instanceof ApiError && error.status === 500) {
    return "The API could not send the invitation. Check AdminInvitation:AcceptUrl and the SMTP settings."
  }
  return errorText(error)
}
