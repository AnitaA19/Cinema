import type { Metadata } from "next"
import { AccountPage } from "@/components/pages/account-page"

export const metadata: Metadata = { title: "My tickets" }

export default function Page() {
  return <AccountPage />
}
