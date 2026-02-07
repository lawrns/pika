import { useState } from 'react'
import type { Transaction } from '@/store/types'
import { transactionsApi } from '@/lib/api'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { 
  Clock, Download, Share2, CheckCircle2, XCircle, AlertCircle, FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TransactionDetailsModalProps {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransactionDetailsModal({ 
  transaction, 
  open, 
  onOpenChange 
}: TransactionDetailsModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  if (!transaction) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const handleDownloadReceipt = async () => {
    setIsLoading(true)
    const result = await transactionsApi.getReceipt(transaction.id)
    
    if (result.data) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(result.data.html)
        printWindow.document.close()
        printWindow.focus()
        toast({ title: 'Receipt opened in new tab' })
      }
    } else {
      toast({ title: result.error || 'Failed to load receipt', variant: 'destructive' })
    }
    setIsLoading(false)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Transaction Details',
          text: `${transaction.description} - ${formatAmount(transaction.amount, transaction.currency)}`
        })
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(`Transaction: ${transaction.description} - ${formatAmount(transaction.amount, transaction.currency)}`)
      toast({ title: 'Copied to clipboard!' })
    }
  }

  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'completed':
        return <CheckCircle2 className="h-12 w-12 text-green-500" />
      case 'pending':
        return <Clock className="h-12 w-12 text-yellow-500" />
      case 'failed':
        return <XCircle className="h-12 w-12 text-red-500" />
      default:
        return <AlertCircle className="h-12 w-12 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (transaction.status) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
      case 'failed':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const isIncoming = transaction.type === 'incoming'
  const isOutgoing = transaction.type === 'outgoing'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4">
            {getStatusIcon()}
          </div>
          <DialogTitle className="text-center">
            {transaction.description}
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-1">
          <p className={cn(
            "text-3xl font-bold",
            isIncoming && "text-green-600",
            isOutgoing && "text-red-600"
          )}>
            {isIncoming ? '+' : '-'}{formatAmount(transaction.amount, transaction.currency)}
          </p>
          <Badge className={cn("text-sm px-3 py-1", getStatusColor())}>
            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
          </Badge>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Transaction ID</span>
            <span className="font-mono text-sm">{transaction.id}</span>
          </div>
          
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Date & Time</span>
            <span className="text-right">{formatDate(transaction.date)}</span>
          </div>

          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Type</span>
            <span className="capitalize">{transaction.type}</span>
          </div>

          {transaction.from && (
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">From</span>
              <span>{transaction.from}</span>
            </div>
          )}

          {transaction.to && (
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">To</span>
              <span>{transaction.to}</span>
            </div>
          )}

          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Currency</span>
            <span>{transaction.currency}</span>
          </div>
        </div>

        <Separator />

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleDownloadReceipt}
            disabled={isLoading}
          >
            {isLoading ? (
              <Skeleton className="h-4 w-4 rounded-full" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Receipt
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleShare}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Need help?</p>
              <p className="text-xs text-muted-foreground">
                If you have any questions about this transaction, contact our support team.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
