import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Skeleton } from '@/components/ui/skeleton'
import { LoginPage } from '@/components/auth/LoginPage'
import { RegisterPage } from '@/components/auth/RegisterPage'

const DashboardOverviewPage = lazy(() => import('@/components/pages/DashboardOverviewPage').then(m => ({ default: m.default })))
const WalletPage = lazy(() => import('@/components/pages/WalletPage').then(m => ({ default: m.default })))
const TransactionsPage = lazy(() => import('@/components/pages/TransactionsPage').then(m => ({ default: m.default })))
const SendPage = lazy(() => import('@/components/pages/SendPage').then(m => ({ default: m.default })))
const QRPage = lazy(() => import('@/components/pages/QRPage').then(m => ({ default: m.default })))
const ContactsPage = lazy(() => import('@/components/pages/ContactsPage').then(m => ({ default: m.default })))
const SettingsPage = lazy(() => import('@/components/pages/SettingsPage').then(m => ({ default: m.default })))
const PublicPayPage = lazy(() => import('@/components/pages/PublicPayPage').then(m => ({ default: m.default })))
const PublicPayerPage = lazy(() => import('@/components/pages/PublicPayerPage').then(m => ({ default: m.default })))
const LandingPage = lazy(() => import('@/components/pages/LandingPage').then(m => ({ default: m.default })))
const CreateRequestPage = lazy(() => import('@/components/pages/CreateRequestPage').then(m => ({ default: m.default })))
const ConfirmationPage = lazy(() => import('@/components/pages/ConfirmationPage').then(m => ({ default: m.default })))
const HelpPage = lazy(() => import('@/components/pages/HelpPage').then(m => ({ default: m.default })))

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAppStore()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/pay/:referenceCode" element={<PublicPayPage />} />
        <Route path="/p/:slug" element={<PublicPayerPage />} />
        <Route path="/paid/:paymentId" element={<ConfirmationPage />} />
        <Route path="/dashboard/*" element={
          <ProtectedRoute>
            <Routes>
              {/* Nested layout dashboard pages */}
              <Route path="*" element={
                <DashboardLayout>
                  <Routes>
                    <Route index element={<DashboardOverviewPage />} />
                    <Route path="wallet" element={<WalletPage />} />
                    <Route path="transactions" element={<TransactionsPage />} />
                    <Route path="send" element={<SendPage />} />
                    <Route path="qr" element={<QRPage />} />
                    <Route path="contacts" element={<ContactsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="help" element={<HelpPage />} />
                  </Routes>
                </DashboardLayout>
              } />
              {/* Standalone wizard pages */}
              <Route path="requests/new" element={<CreateRequestPage />} />
            </Routes>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}
