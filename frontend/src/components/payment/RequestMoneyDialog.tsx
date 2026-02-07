import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DollarSign } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface RequestMoneyDialogProps {
  onRequest?: (data: { from: string; amount: number; description: string }) => void
}

export function RequestMoneyDialog({ onRequest }: RequestMoneyDialogProps) {
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const { toast } = useToast()

  const handleRequest = () => {
    if (!from || !amount) {
      toast({
        title: 'Missing information',
        description: 'Please enter a recipient and amount.',
        variant: 'destructive'
      })
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount.',
        variant: 'destructive'
      })
      return
    }

    onRequest?.({
      from,
      amount: amountNum,
      description: description || 'Payment request'
    })

    toast({
      title: 'Request sent!',
      description: `Payment request sent to ${from}.`
    })

    setOpen(false)
    setFrom('')
    setAmount('')
    setDescription('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <DollarSign className="mr-2 h-4 w-4" />
          Request Money
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Money</DialogTitle>
          <DialogDescription>
            Send a payment request to anyone.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="from">Request from</Label>
            <Input
              id="from"
              placeholder="Name, email, or phone"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              placeholder="What's this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleRequest}>Request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
