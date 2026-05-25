import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Wallet, Transaction, Contact, AppSettings } from './types'
import { setAuthToken } from '@/lib/api'

interface AppStore {
  user: User | null
  isAuthenticated: boolean
  wallet: Wallet
  balanceLastUpdated?: number
  transactions: Transaction[]
  contacts: Contact[]
  settings: AppSettings
  isLoading: boolean
  setUser: (user: User | null) => void
  login: (user: User, token: string) => void
  logout: () => void
  updateBalance: (amount: number) => void
  setWallet: (wallet: Wallet) => void
  setTransactions: (transactions: Transaction[]) => void
  addTransaction: (transaction: Transaction) => void
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  addContact: (contact: Contact) => void
  updateContact: (id: string, updates: Partial<Contact>) => void
  removeContact: (id: string) => void
  setSettings: (settings: Partial<AppSettings>) => void
  updateSettings: (settings: Partial<AppSettings>) => void
  setLoading: (loading: boolean) => void
}

const defaultSettings: AppSettings = {
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
  marketingEmails: false,
  twoFactorEnabled: false
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      wallet: { balance: 0, accountNumber: '', accountName: 'Pika MXN Wallet', currency: 'MXN' },
      balanceLastUpdated: undefined,
      transactions: [],
      contacts: [],
      settings: defaultSettings,
      isLoading: false,
      setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
      login: (user, token) => { setAuthToken(token); set({ user, isAuthenticated: true, isLoading: false }) },
      logout: () => { setAuthToken(null); set({ user: null, isAuthenticated: false, transactions: [], contacts: [] }) },
      updateBalance: (amount) => set((state) => ({ wallet: { ...state.wallet, balance: state.wallet.balance + amount }, balanceLastUpdated: Date.now() })),
      setWallet: (wallet) => set({ wallet, balanceLastUpdated: Date.now() }),
      setTransactions: (transactions) => set({ transactions }),
      addTransaction: (transaction) => set((state) => ({ transactions: [transaction, ...state.transactions] })),
      updateTransaction: (id, updates) => set((state) => ({ transactions: state.transactions.map(t => t.id === id ? { ...t, ...updates } : t) })),
      deleteTransaction: (id) => set((state) => ({ transactions: state.transactions.filter(t => t.id !== id) })),
      addContact: (contact) => set((state) => ({ contacts: [...state.contacts, contact] })),
      updateContact: (id, updates) => set((state) => ({ contacts: state.contacts.map(c => c.id === id ? { ...c, ...updates } : c) })),
      removeContact: (id) => set((state) => ({ contacts: state.contacts.filter(c => c.id !== id) })),
      setSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),
      updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),
      setLoading: (loading) => set({ isLoading: loading })
    }),
    { name: 'pika-storage', partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated, settings: state.settings }) }
  )
)
