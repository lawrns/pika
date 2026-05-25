import type { Transaction, Contact, User, Wallet, PaymentLink, PublicPaymentLink } from '@/store/types'

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'https://isw6kd7ljtiew2p41enfegtz.45.132.242.102.sslip.io/api/v1').replace(/\/$/, '')
const TOKEN_KEY = 'pika-auth-token'

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const headers = new Headers(options.headers)
    if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json')
    const token = getAuthToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)

    const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
    const payload = await res.json().catch(() => ({}))
    if (!res.ok) {
      if (payload.error === 'Validation failed' && payload.details) {
        // Humanize common Joi error messages for registration password checks
        return { 
          error: payload.details.map((d: any) => {
            if (d.field === 'password') {
              return 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número';
            }
            return d.message;
          }).join('. ') 
        };
      }
      return { error: payload.error || payload.message || `HTTP ${res.status}` };
    }
    return { data: payload as T, message: payload.message }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Network request failed' }
  }
}

function mapUser(raw: any): User {
  return {
    id: raw.id,
    name: raw.fullName || raw.full_name || raw.name || raw.email,
    email: raw.email,
    phone: raw.phone,
    isVerified: Boolean(raw.isVerified ?? raw.is_verified),
  }
}

function mapTransaction(tx: any): Transaction {
  const type = String(tx.type || '').toLowerCase()
  const status = String(tx.status || '').toLowerCase()
  return {
    id: tx.id,
    type: type === 'credit' || type === 'deposit' || type === 'payment' ? 'incoming' : type === 'debit' || type === 'withdrawal' ? 'outgoing' : 'transfer',
    amount: Number(tx.amount || 0),
    currency: tx.currency || 'MXN',
    description: tx.description || tx.referenceCode || tx.reference_code || 'Pika transaction',
    date: tx.createdAt || tx.created_at || new Date().toISOString(),
    status: status === 'completed' || status === 'paid' ? 'completed' : status === 'failed' ? 'failed' : 'pending',
    from: tx.counterpartyInfo?.from || tx.counterparty_info?.from,
    to: tx.counterpartyInfo?.to || tx.counterparty_info?.to,
  }
}

function mapPaymentLink(link: any): PaymentLink {
  const referenceCode = link.referenceCode || link.reference_code || link.shortCode || link.slug || link.id
  const url = link.paymentUrl || link.url || `${window.location.origin}/pay/${referenceCode}`
  return {
    id: link.id,
    referenceCode,
    amount: Number(link.amount || 0),
    currency: link.currency || 'MXN',
    description: link.description || link.title || '',
    status: link.status || (link.isActive === false ? 'cancelled' : 'active'),
    expiresAt: link.expiresAt || link.expires_at,
    paymentUrl: url,
    qrCode: link.qrCode,
    createdAt: link.createdAt || link.created_at,
  }
}

export const authApi = {
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    const result = await request<any>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
    if (result.error || !result.data) return { error: result.error || 'Login failed' }
    const user = mapUser(result.data.user)
    setAuthToken(result.data.token)
    return { data: { user, token: result.data.token }, message: result.message }
  },

  async register(name: string, email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    const result = await request<any>('/auth/register', { method: 'POST', body: JSON.stringify({ fullName: name, email, password }) })
    if (result.error || !result.data) return { error: result.error || 'Registration failed' }
    const user = mapUser(result.data.user)
    setAuthToken(result.data.token)
    return { data: { user, token: result.data.token }, message: result.message }
  },

  async me(): Promise<ApiResponse<{ user: User }>> {
    const result = await request<any>('/auth/me')
    if (result.error || !result.data) return { error: result.error || 'Not authenticated' }
    return { data: { user: mapUser(result.data.user) } }
  },

  async logout(): Promise<ApiResponse<void>> {
    await request('/auth/logout', { method: 'POST' })
    setAuthToken(null)
    return { data: undefined }
  }
}

export const walletApi = {
  async getBalance(): Promise<ApiResponse<Wallet>> {
    const result = await request<any>('/wallet')
    if (result.error || !result.data) return { error: result.error || 'Wallet unavailable' }
    return { data: { balance: Number(result.data.balance || 0), accountNumber: result.data.walletId || '', accountName: 'Pika MXN Wallet', currency: result.data.currency || 'MXN' } }
  },

  async addFunds(amount: number, paymentMethod: string): Promise<ApiResponse<{ balance: number; transaction: Transaction }>> {
    const result = await request<any>('/payments/spei/create', { method: 'POST', body: JSON.stringify({ amount, description: `Wallet top-up via ${paymentMethod}` }), headers: { 'Idempotency-Key': crypto.randomUUID?.() || String(Date.now()) } })
    if (result.error) return { error: result.error }
    return { data: { balance: 0, transaction: mapTransaction(result.data?.transaction || { id: result.data?.trackingKey || Date.now(), amount, currency: 'MXN', status: 'pending', type: 'deposit', description: 'SPEI deposit pending' }) } }
  },

  async withdraw(_amount: number, _bankAccount: string): Promise<ApiResponse<{ balance: number; transaction: Transaction }>> {
    return { error: 'Withdrawals are disabled until payout rails are fully verified.' }
  },

  async transfer(toAccount: string, amount: number, description?: string): Promise<ApiResponse<{ balance: number; transaction: Transaction }>> {
    const result = await request<any>('/wallet/transfer', { method: 'POST', body: JSON.stringify({ recipientEmail: toAccount, amount, description }), headers: { 'Idempotency-Key': crypto.randomUUID?.() || String(Date.now()) } })
    if (result.error) return { error: result.error }
    return { data: { balance: Number(result.data?.newBalance || 0), transaction: mapTransaction(result.data?.transaction || { id: Date.now(), amount, currency: 'MXN', status: 'pending', type: 'transfer', description }) } }
  }
}

export const transactionsApi = {
  async getAll(filters?: { startDate?: string; endDate?: string; type?: string; status?: string; search?: string }): Promise<ApiResponse<Transaction[]>> {
    const params = new URLSearchParams()
    Object.entries(filters || {}).forEach(([k, v]) => v && v !== 'all' && params.set(k, v))
    const result = await request<any>(`/transactions${params.toString() ? `?${params}` : ''}`)
    if (result.error || !result.data) return { error: result.error || 'Transactions unavailable' }
    return { data: (result.data.transactions || []).map(mapTransaction) }
  },

  async getById(id: string): Promise<ApiResponse<Transaction>> {
    const result = await request<any>(`/transactions/${id}`)
    if (result.error || !result.data) return { error: result.error || 'Transaction not found' }
    return { data: mapTransaction(result.data.transaction || result.data) }
  },

  async getReceipt(id: string): Promise<ApiResponse<{ url: string; html: string }>> {
    return { data: { url: `${API_BASE_URL}/transactions/${id}/receipt`, html: '' } }
  },

  async export(format: 'csv' | 'pdf', dateRange?: { start?: string; end?: string }): Promise<ApiResponse<{ url: string; filename: string }>> {
    const params = new URLSearchParams({ format })
    if (dateRange?.start) params.set('startDate', dateRange.start)
    if (dateRange?.end) params.set('endDate', dateRange.end)
    return { data: { url: `${API_BASE_URL}/transactions/export?${params}`, filename: `pika-transactions.${format}` } }
  }
}

export const contactsApi = {
  async getAll(): Promise<ApiResponse<Contact[]>> { return { data: [] } },
  async create(contact: Omit<Contact, 'id'>): Promise<ApiResponse<Contact>> { return { data: { ...contact, id: crypto.randomUUID?.() || String(Date.now()) } } },
  async update(id: string, updates: Partial<Contact>): Promise<ApiResponse<Contact>> { return { data: { id, name: updates.name || 'Contact', ...updates } } },
  async delete(_id: string): Promise<ApiResponse<void>> { return { data: undefined } },
  async search(_query: string): Promise<ApiResponse<Contact[]>> { return { data: [] } }
}

export const paymentLinksApi = {
  async create(amount: number, description?: string, expiresIn = 24): Promise<ApiResponse<PaymentLink>> {
    const result = await request<any>('/payments/links', { method: 'POST', body: JSON.stringify({ amount, currency: 'MXN', description, expiresIn }), headers: { 'Idempotency-Key': crypto.randomUUID?.() || String(Date.now()) } })
    if (result.error || !result.data) return { error: result.error || 'Payment link creation failed' }
    return { data: mapPaymentLink(result.data.paymentLink || result.data) }
  },
  async list(): Promise<ApiResponse<PaymentLink[]>> {
    const result = await request<any>('/payments/links')
    if (result.error || !result.data) return { error: result.error || 'Payment links unavailable' }
    return { data: (result.data.paymentLinks || []).map(mapPaymentLink) }
  },
  async getPublic(referenceCode: string): Promise<ApiResponse<PublicPaymentLink>> {
    const result = await request<any>(`/payments/public/${encodeURIComponent(referenceCode)}`)
    if (result.error || !result.data) return { error: result.error || 'Payment link not found' }
    const link = result.data.paymentLink || result.data
    return { data: { ...mapPaymentLink(link), merchantName: link.merchantName || link.merchant_name || 'Pika merchant' } }
  },
  async startPublicPayment(referenceCode: string, payer: { name?: string; email?: string; phone?: string }): Promise<ApiResponse<{ status: string; instructions: string }>> {
    const result = await request<any>(`/payments/public/${encodeURIComponent(referenceCode)}/intent`, { method: 'POST', body: JSON.stringify(payer) })
    if (result.error || !result.data) return { error: result.error || 'Could not start payment' }
    return { data: result.data }
  }
}

export const qrApi = {
  async generatePaymentQR(amount: number, description?: string): Promise<ApiResponse<{ qrData: string; url: string; expiresAt: string }>> {
    const result = await paymentLinksApi.create(amount, description)
    if (result.error || !result.data) return { error: result.error || 'QR creation failed' }
    return { data: { qrData: result.data.paymentUrl, url: result.data.paymentUrl, expiresAt: result.data.expiresAt || new Date(Date.now() + 86400000).toISOString() } }
  },
  async scanAndProcess(qrData: string): Promise<ApiResponse<{ type: string; amount?: number; description?: string; recipient?: string; action: 'payment' | 'url' | 'contact' }>> {
    return { data: { type: qrData.startsWith('http') ? 'url' : 'payment', action: qrData.startsWith('http') ? 'url' : 'payment' } }
  }
}

export const settingsApi = {
  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> { return { data: userData as User } },
  async changePassword(_currentPassword?: string, _newPassword?: string): Promise<ApiResponse<void>> { return { error: 'Password changes require the next security pass.' } },
  async updateSettings(_settings?: Record<string, unknown>): Promise<ApiResponse<void>> { return { data: undefined } },
  async enableTwoFactor(): Promise<ApiResponse<{ qrCode: string; secret: string }>> { return { error: '2FA enrollment is not enabled yet.' } },
  async verifyTwoFactor(_code?: string): Promise<ApiResponse<void>> { return { error: '2FA enrollment is not enabled yet.' } },
  async disableTwoFactor(_code?: string): Promise<ApiResponse<void>> { return { error: '2FA enrollment is not enabled yet.' } }
}

export default { auth: authApi, wallet: walletApi, transactions: transactionsApi, contacts: contactsApi, qr: qrApi, settings: settingsApi, paymentLinks: paymentLinksApi }
