import type { ReactNode } from "react"
import AdminPWAHead from "@/components/admin-pwa-head"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminPWAHead />
      {children}
    </>
  )
}
