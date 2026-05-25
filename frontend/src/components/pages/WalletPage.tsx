import { useState } from 'react'
import { useAppStore } from '@/store'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { walletApi } from '@/lib/api'
import { 
  ArrowUpRight, ArrowDownLeft, Wallet, CreditCard, 
  Banknote, Clock, AlertCircle, Plus, Minus, Loader2
} from 'lucide-react'

function formatCurrency(amount: number, currency: string = 'MXN') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export default function WalletPage() {
  const { wallet, updateBalance, addTransaction } = useAppStore()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false)
  const [addAmount, setAddAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card')

  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [bankAccount] = useState('**** 4582')

  const handleAddFunds = async () => {
    const amount = parseFloat(addAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Please enter a valid amount', variant: 'destructive' })
      return
    }

    setIsLoading(true)
    const result = await walletApi.addFunds(amount, paymentMethod)
    
    if (result.data) {
      updateBalance(amount)
      addTransaction(result.data.transaction)
      toast({ 
        title: 'Funds added successfully!',
        description: `${formatCurrency(amount)} has been added to your wallet`
      })
      setIsAddFundsOpen(false)
      setAddAmount('')
    } else {
      toast({ title: result.error || 'Failed to add funds', variant: 'destructive' })
    }
    setIsLoading(false)
  }

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Please enter a valid amount', variant: 'destructive' })
      return
    }

    if (amount > wallet.balance) {
      toast({ title: 'Insufficient funds', variant: 'destructive' })
      return
    }

    setIsLoading(true)
    const result = await walletApi.withdraw(amount, bankAccount)
    
    if (result.data) {
      updateBalance(-amount)
      addTransaction(result.data.transaction)
      toast({ 
        title: 'Withdrawal initiated',
        description: `${formatCurrency(amount)} will be transferred to your bank account`
      })
      setIsWithdrawOpen(false)
      setWithdrawAmount('')
    } else {
      toast({ title: result.error || 'Failed to withdraw', variant: 'destructive' })
    }
    setIsLoading(false)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
          <p className="text-muted-foreground">
            Manage your balance and payment methods
          </p>
        </div>

        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Wallet className="h-32 w-32" />
          </div>
          <CardContent className="p-8 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-sm opacity-80 mb-1">Total Balance</p>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                  {formatCurrency(wallet.balance)}
                </h2>
                <p className="text-sm opacity-80 mt-2">
                  {wallet.accountName} • {wallet.accountNumber}
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="secondary" 
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => setIsAddFundsOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Funds
                </Button>
                <Button 
                  variant="secondary" 
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => setIsWithdrawOpen(true)}
                >
                  <Minus className="mr-2 h-4 w-4" />
                  Withdraw
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ArrowDownLeft className="h-4 w-4 text-green-500" />
                Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">+$2,450</p>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-red-500" />
                Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">-$1,230</p>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">$120</p>
              <p className="text-xs text-muted-foreground">2 transactions</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-500" />
                Cards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">2</p>
              <p className="text-xs text-muted-foreground">Linked cards</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                  VISA
                </div>
                <div>
                  <p className="font-medium">Visa ending in 4242</p>
                  <p className="text-sm text-muted-foreground">Expires 12/25</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-green-600 rounded flex items-center justify-center text-white text-xs font-bold">
                  CHASE
                </div>
                <div>
                  <p className="font-medium">Chase Bank ****4582</p>
                  <p className="text-sm text-muted-foreground">Checking Account</p>
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Payment Method
            </Button>
          </CardContent>
        </Card>

        {isAddFundsOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Add Funds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="amount"
                      type="number"
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      placeholder="0.00"
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={paymentMethod === 'card' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('card')}
                      className="justify-start"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Card
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethod === 'bank' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('bank')}
                      className="justify-start"
                    >
                      <Banknote className="mr-2 h-4 w-4" />
                      Bank
                    </Button>
                  </div>
                </div>
                <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5" />
                    <p>Funds will be available instantly. Processing fee may apply.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setIsAddFundsOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleAddFunds}
                    disabled={!addAmount || isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Funds
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isWithdrawOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Withdraw Funds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount">Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="withdraw-amount"
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="pl-8"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Available: {formatCurrency(wallet.balance)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>To Account</Label>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-8 bg-green-600 rounded flex items-center justify-center text-white text-xs font-bold">
                        CHASE
                      </div>
                      <div>
                        <p className="font-medium">Chase Bank</p>
                        <p className="text-sm text-muted-foreground">{bankAccount}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5" />
                    <p>Withdrawals typically take 1-3 business days to process.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setIsWithdrawOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleWithdraw}
                    disabled={!withdrawAmount || isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Withdraw
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
