import { Card, CardContent } from '@/components/ui/card'
import { Wallet } from 'lucide-react'

interface WalletBalanceProps {
  balance: number
  currency: string
  accountNumber: string
}

export function WalletBalance({ balance, currency, accountNumber }: WalletBalanceProps) {
  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  return (
    <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm opacity-80">Total Balance</p>
            <h2 className="text-4xl font-bold tracking-tight">
              {formatBalance(balance)}
            </h2>
            <p className="text-sm opacity-80">Account {accountNumber}</p>
          </div>
          <div className="rounded-full bg-white/20 p-3">
            <Wallet className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
