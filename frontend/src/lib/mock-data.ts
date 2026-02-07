import type { Transaction, Contact, User, Wallet } from '@/store/types'

export const mockUser: User = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
}

export const mockWallet: Wallet = {
  balance: 2456.80,
  accountNumber: '****4582',
  accountName: 'John Doe',
  currency: 'USD'
}

export const mockTransactions: Transaction[] = [
  {
    id: 'txn-1',
    type: 'incoming',
    amount: 1250,
    currency: 'USD',
    description: 'Payment for services',
    date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: 'completed',
    from: 'Sarah Johnson'
  },
  {
    id: 'txn-2',
    type: 'outgoing',
    amount: 89.99,
    currency: 'USD',
    description: 'Netflix subscription',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: 'completed',
    to: 'Netflix Inc.'
  },
  {
    id: 'txn-3',
    type: 'incoming',
    amount: 500,
    currency: 'USD',
    description: 'Freelance payment',
    date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    status: 'completed',
    from: 'Mike Chen'
  },
  {
    id: 'txn-4',
    type: 'outgoing',
    amount: 125.50,
    currency: 'USD',
    description: 'Grocery shopping',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    status: 'completed',
    to: 'Whole Foods Market'
  },
  {
    id: 'txn-5',
    type: 'transfer',
    amount: 200,
    currency: 'USD',
    description: 'Transfer to savings',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    status: 'completed',
    to: 'Savings Account'
  },
  {
    id: 'txn-6',
    type: 'outgoing',
    amount: 65,
    currency: 'USD',
    description: 'Gas station',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    status: 'completed',
    to: 'Shell Station'
  },
  {
    id: 'txn-7',
    type: 'incoming',
    amount: 3200,
    currency: 'USD',
    description: 'Salary deposit',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    status: 'completed',
    from: 'Employer Inc.'
  },
  {
    id: 'txn-8',
    type: 'outgoing',
    amount: 45,
    currency: 'USD',
    description: 'Coffee shop',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    status: 'completed',
    to: 'Starbucks'
  },
  {
    id: 'txn-9',
    type: 'pending',
    amount: 250,
    currency: 'USD',
    description: 'Scheduled transfer to brother',
    date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    status: 'pending',
    to: 'Robert Doe'
  },
  {
    id: 'txn-10',
    type: 'incoming',
    amount: 120,
    currency: 'USD',
    description: 'Split dinner bill',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    status: 'failed',
    from: 'Alice Smith'
  }
]

export const mockContacts: Contact[] = [
  {
    id: 'contact-1',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '+1 234 567 8901',
    accountNumber: '9876543210',
    isFavorite: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
  },
  {
    id: 'contact-2',
    name: 'Mike Chen',
    email: 'mike.chen@email.com',
    phone: '+1 234 567 8902',
    accountNumber: '1234567890',
    isFavorite: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike'
  },
  {
    id: 'contact-3',
    name: 'Robert Doe',
    email: 'robert.doe@email.com',
    phone: '+1 234 567 8903',
    isFavorite: false,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert'
  },
  {
    id: 'contact-4',
    name: 'Alice Smith',
    email: 'alice.smith@email.com',
    phone: '+1 234 567 8904',
    accountNumber: '5555555555',
    isFavorite: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice'
  },
  {
    id: 'contact-5',
    name: 'David Williams',
    email: 'david.w@email.com',
    phone: '+1 234 567 8905',
    isFavorite: false,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David'
  },
  {
    id: 'contact-6',
    name: 'Emma Brown',
    email: 'emma.brown@email.com',
    phone: '+1 234 567 8906',
    accountNumber: '7777777777',
    isFavorite: false,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma'
  }
]

// Helper function to get initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Helper function to format currency
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

// Helper function to format date
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

// Helper function to get transaction status color
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}
