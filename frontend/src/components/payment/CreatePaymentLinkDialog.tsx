import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Link } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface CreatePaymentLinkDialogProps {
  onCreate?: (data: { amount: number; description: string; expiry: string }) => void
}

export function CreatePaymentLinkDialog({ onCreate }: CreatePaymentLinkDialogProps) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [expiry, setExpiry] = useState('24h')
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const { toast } = useToast()

  const handleCreate = () => {
    if (!amount) {
      toast({
        title: 'Missing amount',
        description: 'Please enter an amount for the payment link.',
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

    const linkId = Math.random().toString(36).substring(2, 10)
    const link = `https://pika.pay/link/${linkId}`
    
    setGeneratedLink(link)
    
    onCreate?.({
      amount: amountNum,
      description: description || 'Payment link',
      expiry
    })

    toast({
      title: 'Payment link created!',
      description: 'Your payment link is ready to share.'
    })
  }

  const handleCopy = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink)
      toast({
        title: 'Copied!',
        description: 'Payment link copied to clipboard.'
      })
    }
  }

  const handleReset = () => {
    setGeneratedLink(null)
    setAmount('')
    setDescription('')
    setExpiry('24h')
  }

  const handleClose = () => {
    setOpen(false)
    setTimeout(handleReset, 200)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Link className="mr-2 h-4 w-4" />
          Create Payment Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Payment Link</DialogTitle>
          <DialogDescription>
            {generatedLink 
              ? 'Share this link to receive payments'
              : 'Create a shareable payment link for anyone to pay you.'
            }
          </DialogDescription>
        </DialogHeader>
        
        {!generatedLink ? (
          <div className="grid gap-4 py-4">
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
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="What's this for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expiry">Link expires in</Label>
              <Select value={expiry} onValueChange={setExpiry}>
                <SelectTrigger id="expiry">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 hour</SelectItem>
                  <SelectItem value="24h">24 hours</SelectItem>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="py-6 space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Payment Link</p>
              <p className="font-mono text-sm break-all">{generatedLink}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCopy} className="flex-1">
                Copy Link
              </Button>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={generatedLink ? handleReset : handleClose}>
            {generatedLink ? 'Create Another' : 'Cancel'}
          </Button>
          {!generatedLink && (
            <Button onClick={handleCreate}>Create Link</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
