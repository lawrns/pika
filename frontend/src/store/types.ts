export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  phone?: string
  isVerified?: boolean
}

export interface Wallet {
  balance: number
  accountNumber: string
  accountName: string
  currency?: string
}

export interface Transaction {
  id: string
  type: 'incoming' | 'outgoing' | 'transfer' | 'payment' | 'pending'
  amount: number
  currency: string
  description: string
  date: string
  status: 'completed' | 'pending' | 'failed'
  from?: string
  to?: string
}

export interface Contact {
  id: string
  name: string
  email?: string
  phone?: string
  accountNumber?: string
  isFavorite?: boolean
  avatar?: string
}

export type NotificationVariant = 'default' | 'destructive' | 'success' | 'warning'

export interface Notification {
  id: string
  title: string
  description?: string
  variant?: NotificationVariant
  timestamp: number
}

export interface AppSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
  marketingEmails: boolean
  twoFactorEnabled: boolean
}


export interface PaymentLink {
  id: string
  referenceCode: string
  amount: number
  currency: string
  description?: string
  status: string
  expiresAt?: string
  paymentUrl: string
  qrCode?: string
  createdAt?: string
}

export interface PublicPaymentLink extends PaymentLink {
  merchantName: string
}
