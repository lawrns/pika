import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import type { Contact } from '@/store/types'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { walletApi } from '@/lib/api'
import { 
  Search, UserPlus, Users, ArrowRight, CheckCircle2,
  Star, Loader2, QrCode, Wallet
} from 'lucide-react'

const quickAmounts = [10, 25, 50, 100, 200, 500]

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

export default function SendPage() {
  const { contacts, wallet, addTransaction, updateBalance } = useAppStore()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)

  useEffect(() => {
    const contactId = searchParams.get('to')
    if (contactId) {
      const contact = contacts.find(c => c.id === contactId)
      if (contact) {
        setSelectedContact(contact)
      }
    }
  }, [searchParams, contacts])

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery)
  )

  const favoriteContacts = filteredContacts.filter(c => c.isFavorite)
  const regularContacts = filteredContacts.filter(c => !c.isFavorite)

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact)
  }

  const handleAmountSelect = (value: number) => {
    setAmount(value.toString())
  }

  const handleContinue = () => {
    const numAmount = parseFloat(amount)
    if (!selectedContact) {
      toast({ title: 'Please select a recipient', variant: 'destructive' })
      return
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: 'Please enter a valid amount', variant: 'destructive' })
      return
    }
    if (numAmount > wallet.balance) {
      toast({ title: 'Insufficient funds', variant: 'destructive' })
      return
    }
    setIsConfirmOpen(true)
  }

  const handleSend = async () => {
    setIsLoading(true)
    const numAmount = parseFloat(amount)
    
    const result = await walletApi.transfer(
      selectedContact?.accountNumber || selectedContact?.email || '',
      numAmount,
      description || `Payment to ${selectedContact?.name}`
    )

    if (result.data) {
      updateBalance(-numAmount)
      addTransaction(result.data.transaction)
      setIsConfirmOpen(false)
      setIsSuccessOpen(true)
      toast({ 
        title: 'Payment sent!',
        description: `${formatCurrency(numAmount)} sent to ${selectedContact?.name}`
      })
    } else {
      toast({ title: result.error || 'Failed to send payment', variant: 'destructive' })
    }
    setIsLoading(false)
  }

  const handleSuccessClose = () => {
    setIsSuccessOpen(false)
    setSelectedContact(null)
    setAmount('')
    setDescription('')
    navigate('/dashboard/transactions')
  }

  const ContactCard = ({ contact, isCompact = false }: { contact: Contact; isCompact?: boolean }) => (
    <button
      onClick={() => handleContactSelect(contact)}
      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left w-full ${
        selectedContact?.id === contact.id
          ? 'border-primary bg-primary/5'
          : 'border-transparent hover:bg-muted/50'
      }`}
    >
      <Avatar className={isCompact ? 'h-10 w-10' : 'h-12 w-12'}>
        <AvatarFallback className="bg-primary/10 text-primary">
          {contact.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className={`font-medium truncate ${isCompact ? 'text-sm' : 'text-base'}`}>
            {contact.name}
          </p>
          {contact.isFavorite && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {contact.accountNumber || contact.email || contact.phone}
        </p>
      </div>
    </button>
  )

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Send Money</h1>
          <p className="text-muted-foreground">
            Send money to your contacts instantly
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Select Recipient
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {selectedContact ? (
                <div className="p-4 border rounded-lg bg-primary/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {selectedContact.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{selectedContact.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedContact.accountNumber || selectedContact.email}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedContact(null)}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserPlus className="h-4 w-4 text-primary" />
                    </div>
                    <span>Add New Contact</span>
                  </Button>

                  {favoriteContacts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Favorites</p>
                      <div className="grid grid-cols-2 gap-2">
                        {favoriteContacts.slice(0, 4).map(contact => (
                          <ContactCard key={contact.id} contact={contact} isCompact />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">All Contacts</p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {regularContacts.slice(0, 10).map(contact => (
                        <ContactCard key={contact.id} contact={contact} />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground">$</span>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-8 text-2xl h-16"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={amount === value.toString() ? 'default' : 'outline'}
                    onClick={() => handleAmountSelect(value)}
                    className="text-sm"
                  >
                    ${value}
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Note (optional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this for?"
                />
              </div>

              {selectedContact && amount && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">To</span>
                    <span className="font-medium">{selectedContact.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">{formatCurrency(parseFloat(amount) || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fee</span>
                    <span className="font-medium">Free</span>
                  </div>
                  <div className="pt-2 border-t flex justify-between">
                    <span className="font-medium">Total</span>
                    <span className="font-bold">{formatCurrency(parseFloat(amount) || 0)}</span>
                  </div>
                </div>
              )}

              <Button 
                className="w-full h-12 text-lg"
                onClick={handleContinue}
                disabled={!selectedContact || !amount}
              >
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/50 border-dashed">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <QrCode className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Scan QR Code</p>
                  <p className="text-sm text-muted-foreground">
                    Send money by scanning a payment QR code
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate('/dashboard/qr')}>
                Open Scanner
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground mb-1">Sending</p>
              <p className="text-4xl font-bold">{formatCurrency(parseFloat(amount) || 0)}</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">To</span>
                <span className="font-medium">{selectedContact?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">From</span>
                <span className="font-medium">{wallet.accountName}</span>
              </div>
              {description && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Note</span>
                  <span className="font-medium">{description}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1"
              onClick={handleSend}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="text-center">
          <div className="py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-2xl mb-2">Payment Sent!</DialogTitle>
            <p className="text-muted-foreground">
              {formatCurrency(parseFloat(amount) || 0)} has been sent to {selectedContact?.name}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={handleSuccessClose} className="w-full">
              View Transaction
            </Button>
            <Button variant="outline" onClick={() => {
              setIsSuccessOpen(false)
              setSelectedContact(null)
              setAmount('')
              setDescription('')
            }}>
              Send Another
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
