import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Contact } from '@/types'
import { Send } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface SendMoneyDialogProps {
  contacts: Contact[]
  onSend?: (data: { to: string; amount: number; description: string }) => void
}

export function SendMoneyDialog({ contacts, onSend }: SendMoneyDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const { toast } = useToast()

  const handleSend = () => {
    if (!selectedContact || !amount) {
      toast({
        title: 'Missing information',
        description: 'Please select a recipient and enter an amount.',
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

    onSend?.({
      to: selectedContact,
      amount: amountNum,
      description: description || 'Payment'
    })

    toast({
      title: 'Payment sent!',
      description: `Successfully sent ${amountNum} to ${selectedContact}.`
    })

    setOpen(false)
    setSelectedContact('')
    setAmount('')
    setDescription('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Send className="mr-2 h-4 w-4" />
          Send Money
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Money</DialogTitle>
          <DialogDescription>
            Send money to anyone in your contacts list.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="recipient">Recipient</Label>
            <Select value={selectedContact} onValueChange={setSelectedContact}>
              <SelectTrigger id="recipient">
                <SelectValue placeholder="Select a contact" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.name}>
                    {contact.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Button onClick={handleSend}>Send</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
