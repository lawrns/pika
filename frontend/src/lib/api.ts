import type { User, Contact } from '@/store/types'

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// Single source of truth for the API origin. Pages and the client all import this.
// Set VITE_API_URL in your .env.local for local development.
// In production (behind nginx proxy), use relative path so the same origin works.
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '')
const TOKEN_KEY = 'pika-auth-token'

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extra }
  const token = getAuthToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
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
              return 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número'
            }
            return d.message
          }).join('. ')
        }
      }
      return { error: payload.error || payload.message || `HTTP ${res.status}` }
    }
    return { data: payload as T, message: payload.message }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Network request failed' }
  }
}

function mapUser(raw: any): User {
  return {
    id: raw.id,
    name: raw.displayName || raw.fullName || raw.full_name || raw.name || raw.email,
    email: raw.email,
    phone: raw.phone,
    isVerified: Boolean(raw.isVerified ?? raw.is_verified ?? raw.kycLevel === 'verified'),
  }
}

// ── Domain types (orchestration-only payment requests, "cobros") ──

export interface PaymentRequest {
  requestId: string
  concept: string
  note: string
  amountCents: number
  amount: number
  currency: string
  status: string
  publicSlug: string
  publicUrl: string
  paidAmountCents: number
  createdAt: string
  updatedAt: string
  expiresAt: string
}

export interface ReceivingAccount {
  accountId: string
  accountType: string
  maskedIdentifier: string
  isDefault: boolean
  verificationStatus: string
  createdAt: string
}

export interface PublicRequest {
  publicSlug: string
  requesterName: string
  requesterVerified: boolean
  amountCents: number
  amount: number
  currency: string
  concept: string
  note: string
  status: string
  expiresAt: string
}

export function mapRequest(raw: any): PaymentRequest {
  const amountCents = Number(raw.amountCents || 0)
  const slug = raw.publicSlug || ''
  return {
    requestId: raw.requestId || raw.$id || raw.id,
    concept: raw.concept || '',
    note: raw.note || '',
    amountCents,
    amount: amountCents / 100,
    currency: raw.currency || 'MXN',
    status: raw.status || 'pending',
    publicSlug: slug,
    publicUrl: raw.publicUrl || (slug ? `${window.location.origin}/p/${slug}` : ''),
    paidAmountCents: Number(raw.paidAmountCents || 0),
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
    expiresAt: raw.expiresAt || '',
  }
}

function mapAccount(raw: any): ReceivingAccount {
  return {
    accountId: raw.accountId || raw.$id || raw.id,
    accountType: raw.accountType || 'clabe',
    maskedIdentifier: raw.maskedIdentifier || '',
    isDefault: Boolean(raw.isDefault),
    verificationStatus: raw.verificationStatus || 'verified',
    createdAt: raw.createdAt || new Date().toISOString(),
  }
}

function mapContact(raw: any): Contact {
  return {
    id: raw.contactId || raw.$id || raw.id,
    name: raw.name || raw.alias || 'Contacto',
    phone: raw.phone || undefined,
    email: raw.email || undefined,
  }
}

// ── Auth ──

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

// ── Profile (/me) ──

export const profileApi = {
  async get(): Promise<ApiResponse<User>> {
    const result = await request<any>('/me')
    if (result.error || !result.data) return { error: result.error || 'Profile unavailable' }
    return { data: mapUser(result.data) }
  },
  async update(updates: { displayName?: string; phone?: string }): Promise<ApiResponse<User>> {
    const result = await request<any>('/me', { method: 'PATCH', body: JSON.stringify(updates) })
    if (result.error || !result.data) return { error: result.error || 'Could not update profile' }
    return { data: mapUser(result.data) }
  }
}

// ── Payment requests (cobros) ──

export const requestsApi = {
  async create(amountCents: number, concept: string, note?: string, contactId?: string): Promise<ApiResponse<PaymentRequest>> {
    const result = await request<any>('/requests', { method: 'POST', body: JSON.stringify({ amountCents, concept, note, contactId }) })
    if (result.error || !result.data) return { error: result.error || 'No se pudo crear el cobro' }
    return { data: mapRequest(result.data) }
  },
  async list(): Promise<ApiResponse<PaymentRequest[]>> {
    const result = await request<any>('/requests')
    if (result.error || !result.data) return { error: result.error || 'Cobros no disponibles' }
    return { data: (Array.isArray(result.data) ? result.data : []).map(mapRequest) }
  },
  async get(requestId: string): Promise<ApiResponse<PaymentRequest>> {
    const result = await request<any>(`/requests/${encodeURIComponent(requestId)}`)
    if (result.error || !result.data) return { error: result.error || 'Cobro no encontrado' }
    return { data: mapRequest(result.data) }
  },
  async share(requestId: string, channel = 'whatsapp', to?: string): Promise<ApiResponse<{ publicUrl: string }>> {
    const result = await request<any>(`/requests/${encodeURIComponent(requestId)}/share`, { method: 'POST', body: JSON.stringify({ channel, to }) })
    if (result.error || !result.data) return { error: result.error || 'No se pudo registrar la acción' }
    return { data: { publicUrl: result.data.publicUrl } }
  },
  async remind(requestId: string, channel = 'whatsapp', to?: string): Promise<ApiResponse<void>> {
    const result = await request<any>(`/requests/${encodeURIComponent(requestId)}/reminders`, { method: 'POST', body: JSON.stringify({ channel, to }) })
    if (result.error) return { error: result.error }
    return { data: undefined }
  }
}

// ── Receiving accounts (CLABE / DiMo) ──

export const receivingAccountsApi = {
  async list(): Promise<ApiResponse<ReceivingAccount[]>> {
    const result = await request<any>('/receiving-accounts')
    if (result.error || !result.data) return { error: result.error || 'Cuentas no disponibles' }
    return { data: (Array.isArray(result.data) ? result.data : []).map(mapAccount) }
  },
  async create(accountType: string, identifier: string): Promise<ApiResponse<ReceivingAccount>> {
    const result = await request<any>('/receiving-accounts', { method: 'POST', body: JSON.stringify({ accountType, identifier }) })
    if (result.error || !result.data) return { error: result.error || 'No se pudo registrar la cuenta' }
    return { data: mapAccount(result.data) }
  }
}

// ── Contacts ──

export const contactsApi = {
  async getAll(): Promise<ApiResponse<Contact[]>> {
    const result = await request<any>('/contacts')
    if (result.error || !result.data) return { error: result.error || 'Contactos no disponibles' }
    return { data: (Array.isArray(result.data) ? result.data : []).map(mapContact) }
  },
  async create(contact: Omit<Contact, 'id'>): Promise<ApiResponse<Contact>> {
    const result = await request<any>('/contacts', { method: 'POST', body: JSON.stringify({ name: contact.name, phone: contact.phone, email: contact.email }) })
    if (result.error || !result.data) return { error: result.error || 'No se pudo guardar el contacto' }
    return { data: mapContact(result.data) }
  }
}

// ── Public payer flow (no auth) ──

export const publicApi = {
  async getRequest(slug: string): Promise<ApiResponse<PublicRequest>> {
    const result = await request<any>(`/public/requests/${encodeURIComponent(slug)}`)
    if (result.error || !result.data) return { error: result.error || 'No se encontró este cobro Pika' }
    const raw = result.data
    return { data: { ...raw, amount: Number(raw.amountCents || 0) / 100, requesterVerified: raw.requesterVerified ?? true, note: raw.note || '' } }
  },
  async pay(slug: string, payer: { payerName?: string; payerEmail?: string; payerPhone?: string } = {}): Promise<ApiResponse<any>> {
    const result = await request<any>(`/public/requests/${encodeURIComponent(slug)}/pay`, { method: 'POST', body: JSON.stringify(payer) })
    if (result.error || !result.data) return { error: result.error || 'No se pudo iniciar el pago' }
    return { data: result.data }
  },
  async receipt(paymentId: string): Promise<ApiResponse<any>> {
    const result = await request<any>(`/public/payments/${encodeURIComponent(paymentId)}/receipt`)
    if (result.error || !result.data) return { error: result.error || 'Recibo no encontrado' }
    return { data: result.data }
  }
}

export default {
  auth: authApi,
  profile: profileApi,
  requests: requestsApi,
  receivingAccounts: receivingAccountsApi,
  contacts: contactsApi,
  public: publicApi,
}
