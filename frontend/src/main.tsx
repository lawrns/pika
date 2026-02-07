import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { useAppStore } from '@/store'
import { mockUser, mockWallet, mockTransactions, mockContacts } from '@/lib/mock-data'

// Initialize store with mock data
const store = useAppStore.getState()
if (!store.user) {
  store.setUser(mockUser)
  store.setWallet(mockWallet)
  useAppStore.setState({ transactions: mockTransactions, contacts: mockContacts, isAuthenticated: true })
}

import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
