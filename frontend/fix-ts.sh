#!/bin/bash
cd /home/laurence/pika/frontend

# Fix the api.ts imports
cat > src/lib/api.ts << 'EOF'
import type { Transaction, Contact, User, Wallet } from '@/store/types'
import { useAppStore } from '@/store'
// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// Auth API
export const authApi = {
  async login(_email: string, _password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return {
      data: {
        user: {
          id: '1',
          name: 'John Doe',
          email: _email,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
        },
        token: 'mock-jwt-token-' + Date.now()
      }
    }
  },

  async register(name: string, email: string, _password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return {
      data: {
        user: { id: '1', name, email, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}` },
        token: 'mock-jwt-token-' + Date.now()
      }
    }
  },

  async logout(): Promise<ApiResponse<void>> {
    return { data: undefined }
  }
}

// Wallet API
export const walletApi = {
  async getBalance(): Promise<ApiResponse<Wallet>> {
    await new Promise(resolve => setTimeout(resolve, 500))
    const { wallet } = useAppStore.getState()
    return { data: wallet }
  },

  async addFunds(amount: number, paymentMethod: string): Promise<ApiResponse<{ balance: number; transaction: Transaction }>> {
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const transaction: Transaction = {
      id: `txn-${Date.now()}`,
      type: 'incoming',
      amount,
      currency: 'USD',
      description: `Added funds via ${paymentMethod}`,
      date: new Date().toISOString(),
      status: 'completed'
    }
    
    return {
      data: {
        balance: useAppStore.getState().wallet.balance + amount,
        transaction
      }
    }
  },

  async withdraw(amount: number, _bankAccount: string): Promise<ApiResponse<{ balance: number; transaction: Transaction }>> {
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const currentBalance = useAppStore.getState().wallet.balance
    if (amount > currentBalance) {
      return { error: 'Insufficient funds' }
    }
    
    const transaction: Transaction = {
      id: `txn-${Date.now()}`,
      type: 'outgoing',
      amount,
      currency: 'USD',
      description: `Withdrawal to bank account`,
      date: new Date().toISOString(),
      status: 'pending'
    }
    
    return {
      data: {
        balance: currentBalance - amount,
        transaction
      }
    }
  },

  async transfer(toAccount: string, amount: number, description?: string): Promise<ApiResponse<{ balance: number; transaction: Transaction }>> {
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    const currentBalance = useAppStore.getState().wallet.balance
    if (amount > currentBalance) {
      return { error: 'Insufficient funds' }
    }
    
    const transaction: Transaction = {
      id: `txn-${Date.now()}`,
      type: 'outgoing',
      amount,
      currency: 'USD',
      description: description || 'Transfer',
      date: new Date().toISOString(),
      status: 'completed',
      to: toAccount
    }
    
    return {
      data: {
        balance: currentBalance - amount,
        transaction
      }
    }
  }
}

// Transactions API
export const transactionsApi = {
  async getAll(filters?: {
    startDate?: string
    endDate?: string
    type?: string
    status?: string
    search?: string
  }): Promise<ApiResponse<Transaction[]>> {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    let transactions = useAppStore.getState().transactions
    
    if (filters) {
      if (filters.type && filters.type !== 'all') {
        transactions = transactions.filter(t => t.type === filters.type)
      }
      if (filters.status && filters.status !== 'all') {
        transactions = transactions.filter(t => t.status === filters.status)
      }
      if (filters.search) {
        const search = filters.search.toLowerCase()
        transactions = transactions.filter(t => 
          t.description.toLowerCase().includes(search) ||
          t.from?.toLowerCase().includes(search) ||
          t.to?.toLowerCase().includes(search)
        )
      }
    }
    
    return { data: transactions }
  },

  async getById(id: string): Promise<ApiResponse<Transaction>> {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const transaction = useAppStore.getState().transactions.find(t => t.id === id)
    if (!transaction) {
      return { error: 'Transaction not found' }
    }
    
    return { data: transaction }
  },

  async getReceipt(id: string): Promise<ApiResponse<{ url: string; html: string }>> {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const transaction = useAppStore.getState().transactions.find(t => t.id === id)
    if (!transaction) {
      return { error: 'Transaction not found' }
    }
    
    return {
      data: {
        url: `data:text/html,${encodeURIComponent(generateReceiptHTML(transaction))}`,
        html: generateReceiptHTML(transaction)
      }
    }
  },

  async export(format: 'csv' | 'pdf', dateRange?: { start?: string; end?: string }): Promise<ApiResponse<{ url: string; filename: string }>> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const transactions = useAppStore.getState().transactions
    
    if (format === 'csv') {
      const csv = generateCSV(transactions)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      return { data: { url, filename: `transactions-${Date.now()}.csv` } }
    }
    
    return { data: { url: '#', filename: `transactions-${Date.now()}.pdf` } }
  }
}

// Contacts API
export const contactsApi = {
  async getAll(): Promise<ApiResponse<Contact[]>> {
    await new Promise(resolve => setTimeout(resolve, 500))
    return { data: useAppStore.getState().contacts }
  },

  async create(contact: Omit<Contact, 'id'>): Promise<ApiResponse<Contact>> {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const newContact: Contact = {
      ...contact,
      id: `contact-${Date.now()}`
    }
    
    useAppStore.getState().addContact(newContact)
    return { data: newContact }
  },

  async update(id: string, updates: Partial<Contact>): Promise<ApiResponse<Contact>> {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    useAppStore.getState().updateContact(id, updates)
    const contact = useAppStore.getState().contacts.find(c => c.id === id)
    
    if (!contact) {
      return { error: 'Contact not found' }
    }
    
    return { data: contact }
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 500))
    useAppStore.getState().removeContact(id)
    return { data: undefined }
  },

  async search(query: string): Promise<ApiResponse<Contact[]>> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const contacts = useAppStore.getState().contacts.filter(c =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.email?.toLowerCase().includes(query.toLowerCase()) ||
      c.phone?.includes(query)
    )
    
    return { data: contacts }
  }
}

// QR Payments API
export const qrApi = {
  async generatePaymentQR(amount: number, description?: string): Promise<ApiResponse<{ qrData: string; url: string; expiresAt: string }>> {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const paymentId = `pay-${Date.now()}`
    const qrData = JSON.stringify({
      type: 'pika_payment',
      id: paymentId,
      amount,
      description,
      recipient: useAppStore.getState().user?.email
    })
    
    return {
      data: {
        qrData,
        url: `https://pika.pay/p/${paymentId}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    }
  },

  async scanAndProcess(qrData: string): Promise<ApiResponse<{ 
    type: string
    amount?: number
    description?: string
    recipient?: string
    action: 'payment' | 'url' | 'contact'
  }>> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    try {
      const data = JSON.parse(qrData)
      
      if (data.type === 'pika_payment') {
        return {
          data: {
            type: 'payment',
            amount: data.amount,
            description: data.description,
            recipient: data.recipient,
            action: 'payment' as const
          }
        }
      }
    } catch {
      // Not JSON, treat as URL or text
    }
    
    if (qrData.startsWith('http')) {
      return {
        data: {
          type: 'url',
          action: 'url' as const
        }
      }
    }
    
    return {
      data: {
        type: 'text',
        action: 'contact' as const
      }
    }
  }
}

// Settings API
export const settingsApi = {
  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const currentUser = useAppStore.getState().user
    if (!currentUser) {
      return { error: 'Not authenticated' }
    }
    
    const updatedUser = { ...currentUser, ...userData }
    useAppStore.getState().setUser(updatedUser)
    
    return { data: updatedUser }
  },

  async changePassword(_currentPassword: string, _newPassword: string): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { message: 'Password changed successfully' }
  },

  async updateSettings(_settings: Record<string, unknown>): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 600))
    return { data: undefined }
  },

  async enableTwoFactor(): Promise<ApiResponse<{ qrCode: string; secret: string }>> {
    await new Promise(resolve => setTimeout(resolve, 800))
    return {
      data: {
        qrCode: 'mock-qr-code-data',
        secret: 'MOCK2FASECRET'
      }
    }
  },

  async verifyTwoFactor(code: string): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    if (code === '123456') {
      useAppStore.getState().setSettings({ twoFactorEnabled: true })
      return { message: 'Two-factor authentication enabled' }
    }
    
    return { error: 'Invalid verification code' }
  },

  async disableTwoFactor(_code: string): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 600))
    useAppStore.getState().setSettings({ twoFactorEnabled: false })
    return { message: 'Two-factor authentication disabled' }
  }
}

// Helper functions
function generateReceiptHTML(transaction: Transaction): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }
        .receipt { border: 2px solid #333; padding: 30px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 32px; font-weight: bold; color: #2563eb; }
        .details { margin: 20px 0; }
        .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .amount { font-size: 36px; font-weight: bold; text-align: center; margin: 30px 0; }
        .status { text-align: center; padding: 10px; background: ${transaction.status === 'completed' ? '#dcfce7' : transaction.status === 'pending' ? '#fef3c7' : '#fee2e2'}; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="logo">Pika</div>
          <p>Transaction Receipt</p>
        </div>
        <div class="amount">${transaction.type === 'incoming' ? '+' : '-'} $${transaction.amount.toFixed(2)}</div>
        <div class="status">Status: ${transaction.status.toUpperCase()}</div>
        <div class="details">
          <div class="row"><span>Transaction ID</span><span>${transaction.id}</span></div>
          <div class="row"><span>Date</span><span>${new Date(transaction.date).toLocaleString()}</span></div>
          <div class="row"><span>Description</span><span>${transaction.description}</span></div>
          ${transaction.from ? `<div class="row"><span>From</span><span>${transaction.from}</span></div>` : ''}
          ${transaction.to ? `<div class="row"><span>To</span><span>${transaction.to}</span></div>` : ''}
          <div class="row"><span>Type</span><span>${transaction.type}</span></div>
        </div>
        <div class="footer">
          <p>Thank you for using Pika!</p>
          <p>For support, contact support@pika.pay</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateCSV(transactions: Transaction[]): string {
  const headers = ['Date', 'Type', 'Description', 'Amount', 'Currency', 'Status', 'From', 'To']
  const rows = transactions.map(t => [
    t.date,
    t.type,
    t.description,
    t.amount.toString(),
    t.currency,
    t.status,
    t.from || '',
    t.to || ''
  ])
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

export default {
  auth: authApi,
  wallet: walletApi,
  transactions: transactionsApi,
  contacts: contactsApi,
  qr: qrApi,
  settings: settingsApi
}
EOF

echo "Fixed api.ts"

# Fix App.tsx
cat > src/App.tsx << 'EOF'
import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Skeleton } from '@/components/ui/skeleton'

const DashboardOverviewPage = lazy(() => import('@/components/pages/DashboardOverviewPage').then(m => ({ default: m.default })))
const WalletPage = lazy(() => import('@/components/pages/WalletPage').then(m => ({ default: m.default })))
const TransactionsPage = lazy(() => import('@/components/pages/TransactionsPage').then(m => ({ default: m.default })))
const SendPage = lazy(() => import('@/components/pages/SendPage').then(m => ({ default: m.default })))
const QRPage = lazy(() => import('@/components/pages/QRPage').then(m => ({ default: m.default })))
const ContactsPage = lazy(() => import('@/components/pages/ContactsPage').then(m => ({ default: m.default })))
const SettingsPage = lazy(() => import('@/components/pages/SettingsPage').then(m => ({ default: m.default })))

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
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Routes>
                <Route index element={<DashboardOverviewPage />} />
                <Route path="wallet" element={<WalletPage />} />
                <Route path="transactions" element={<TransactionsPage />} />
                <Route path="send" element={<SendPage />} />
                <Route path="qr" element={<QRPage />} />
                <Route path="contacts" element={<ContactsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}
EOF

echo "Fixed App.tsx"

echo "TypeScript fixes applied!"
