import { useState, useMemo } from 'react'
import { useAppStore } from '@/store'
import type { Transaction } from '@/store/types'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { TransactionDetailsModal } from '@/components/transactions/TransactionDetailsModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'
import { transactionsApi } from '@/lib/api'
import { 
  Search, Download, ArrowUpRight, ArrowDownLeft, 
  ArrowLeftRight, FileText, Loader2, X
} from 'lucide-react'

function formatCurrency(amount: number, currency: string = 'MXN') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getStatusBadge(status: string) {
  const variants: Record<string, string> = {
    completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
  }
  return variants[status] || 'bg-gray-100 text-gray-700'
}

function getTypeIcon(type: string) {
  const icons: Record<string, React.ReactNode> = {
    incoming: <ArrowDownLeft className="h-4 w-4 text-green-500" />,
    outgoing: <ArrowUpRight className="h-4 w-4 text-red-500" />,
    transfer: <ArrowLeftRight className="h-4 w-4 text-blue-500" />,
    payment: <FileText className="h-4 w-4 text-purple-500" />
  }
  return icons[type] || <FileText className="h-4 w-4" />
}

function getTypeColor(type: string) {
  const colors: Record<string, string> = {
    incoming: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
    outgoing: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',
    transfer: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
    payment: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300'
  }
  return colors[type] || 'bg-gray-100 text-gray-600'
}

export default function TransactionsPage() {
  const { transactions } = useAppStore()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({})
  const [isExporting, setIsExporting] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = !searchQuery || 
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.from?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.to?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter
      
      const matchesDate = (!dateRange.start || new Date(t.date) >= new Date(dateRange.start)) &&
                         (!dateRange.end || new Date(t.date) <= new Date(dateRange.end))
      
      return matchesSearch && matchesStatus && matchesDate
    })
  }, [transactions, searchQuery, statusFilter, dateRange])

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {}
    
    filteredTransactions.forEach(t => {
      const date = new Date(t.date)
      const key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      if (!groups[key]) groups[key] = []
      groups[key].push(t)
    })
    
    return groups
  }, [filteredTransactions])

  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'incoming')
      .reduce((sum, t) => sum + t.amount, 0)
    const expenses = filteredTransactions
      .filter(t => t.type === 'outgoing')
      .reduce((sum, t) => sum + t.amount, 0)
    return { income, expenses }
  }, [filteredTransactions])

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true)
    const result = await transactionsApi.export(format, dateRange)
    
    if (result.data) {
      const link = document.createElement('a')
      link.href = result.data.url
      link.download = result.data.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({ title: `Transactions exported as ${format.toUpperCase()}` })
    } else {
      toast({ title: result.error || 'Export failed', variant: 'destructive' })
    }
    setIsExporting(false)
  }

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsDetailsOpen(true)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setDateRange({})
  }

  const hasFilters = searchQuery || statusFilter !== 'all' || dateRange.start || dateRange.end

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground">
              View and manage your transaction history
            </p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isExporting}>
                  {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Income</p>
              <p className="text-2xl font-bold text-green-600">+{formatCurrency(stats.income)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Expenses</p>
              <p className="text-2xl font-bold text-red-600">-{formatCurrency(stats.expenses)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Net</p>
              <p className={`text-2xl font-bold ${stats.income - stats.expenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(stats.income - stats.expenses)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Transactions</p>
              <p className="text-2xl font-bold">{filteredTransactions.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
                <Input
                  type="date"
                  value={dateRange.start || ''}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-auto"
                />
                {hasFilters && (
                  <Button variant="ghost" size="icon" onClick={clearFilters}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No transactions found"
                description={hasFilters ? 'Try adjusting your filters' : 'Your transactions will appear here'}
                action={hasFilters ? (
                  <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
                ) : undefined}
              />
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedTransactions).map(([month, txs]) => (
                  <div key={month}>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 sticky top-0 bg-card py-2">
                      {month}
                    </h3>
                    <div className="space-y-2">
                      {txs.map((transaction) => (
                        <div
                          key={transaction.id}
                          onClick={() => handleTransactionClick(transaction)}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor(transaction.type)}`}>
                              {getTypeIcon(transaction.type)}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{transaction.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {transaction.from || transaction.to} • {formatDate(transaction.date)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <div>
                              <p className={`font-semibold text-sm ${transaction.type === 'incoming' ? 'text-green-600' : 'text-foreground'}`}>
                                {transaction.type === 'incoming' ? '+' : '-'}
                                {formatCurrency(transaction.amount)}
                              </p>
                              <Badge className={getStatusBadge(transaction.status)}>
                                {transaction.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TransactionDetailsModal
        transaction={selectedTransaction}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </DashboardLayout>
  )
}
