import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useAppStore } from '@/store'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Skeleton } from '@/components/ui/skeleton'
import { LoginPage } from '@/components/auth/LoginPage'
import { RegisterPage } from '@/components/auth/RegisterPage'
import { Toaster } from '@/components/ui/toaster'
import { ErrorBoundary } from '@/components/ui/error-boundary'

const DashboardOverviewPage = lazy(() => import('@/components/pages/DashboardOverviewPage').then(m => ({ default: m.default })))
const CobrosPage = lazy(() => import('@/components/pages/CobrosPage').then(m => ({ default: m.default })))
const QRPage = lazy(() => import('@/components/pages/QRPage').then(m => ({ default: m.default })))
const ContactsPage = lazy(() => import('@/components/pages/ContactsPage').then(m => ({ default: m.default })))
const SettingsPage = lazy(() => import('@/components/pages/SettingsPage').then(m => ({ default: m.default })))
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

// Legacy /pay/:slug links now resolve to the spec public payer page at /p/:slug.
function LegacyPayRedirect() {
  const { slug } = useParams()
  return <Navigate to={`/p/${slug}`} replace />
}

export default function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Toaster />
      <ErrorBoundary>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/pay/:slug" element={<LegacyPayRedirect />} />
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
                    <Route path="cobros" element={<CobrosPage />} />
                    <Route path="qr" element={<QRPage />} />
                    <Route path="contacts" element={<ContactsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="help" element={<HelpPage />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
      </ErrorBoundary>
    </Suspense>
  )
}
