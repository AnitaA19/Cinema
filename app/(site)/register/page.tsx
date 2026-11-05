import type { Metadata } from "next"
import { RegisterPage } from "@/components/pages/auth-pages"

export const metadata: Metadata = { title: "Create an account" }

export default function Page() {
  return <RegisterPage />
}
