import { Navigate } from "react-router-dom"
import { useAppStore } from "@/store"
import { DashboardLayout } from "@/components/layout/DashboardLayout"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAppStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <DashboardLayout>{children}</DashboardLayout>
}
