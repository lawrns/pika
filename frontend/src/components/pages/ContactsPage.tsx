import { useState } from 'react'
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
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/use-toast'
import { contactsApi } from '@/lib/api'
import { 
  Search, UserPlus, Star, Mail, Phone,
  Edit, Trash2, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ContactsPage() {
  const { contacts, addContact, updateContact, removeContact } = useAppStore()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    accountNumber: '',
    isFavorite: false
  })

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery)
  )

  const favoriteContacts = filteredContacts.filter(c => c.isFavorite)
  const regularContacts = filteredContacts.filter(c => !c.isFavorite)

  const handleOpenAdd = () => {
    setFormData({ name: '', email: '', phone: '', accountNumber: '', isFavorite: false })
    setIsAddOpen(true)
  }

  const handleOpenEdit = (contact: Contact) => {
    setSelectedContact(contact)
    setFormData({
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      accountNumber: contact.accountNumber || '',
      isFavorite: contact.isFavorite || false
    })
    setIsEditOpen(true)
  }

  const handleSubmit = async (isEdit: boolean) => {
    setIsLoading(true)
    
    const result = isEdit
      ? await contactsApi.update(selectedContact!.id, formData)
      : await contactsApi.create(formData)
    
    if (result.data) {
      if (isEdit) {
        updateContact(selectedContact!.id, result.data)
        toast({ title: 'Contact updated successfully!' })
      } else {
        addContact(result.data)
        toast({ title: 'Contact added successfully!' })
      }
      setIsAddOpen(false)
      setIsEditOpen(false)
      setSelectedContact(null)
      setFormData({ name: '', email: '', phone: '', accountNumber: '', isFavorite: false })
    } else {
      toast({ title: result.error || 'Operation failed', variant: 'destructive' })
    }
    setIsLoading(false)
  }

  const handleDelete = async (contact: Contact) => {
    setIsLoading(true)
    const result = await contactsApi.delete(contact.id)
    if (result.data !== undefined) {
      removeContact(contact.id)
      toast({ title: 'Contact deleted' })
    }
    setIsLoading(false)
  }

  const toggleFavorite = async (contact: Contact) => {
    const result = await contactsApi.update(contact.id, { isFavorite: !contact.isFavorite })
    if (result.data) {
      updateContact(contact.id, { isFavorite: !contact.isFavorite })
    }
  }

  const ContactCard = ({ contact }: { contact: Contact }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
      <Avatar className="h-12 w-12">
        <AvatarFallback className="bg-primary/10 text-primary text-lg">
          {contact.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{contact.name}</p>
          {contact.isFavorite && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {contact.email && (
            <span className="flex items-center gap-1 truncate">
              <Mail className="h-3 w-3" />
              {contact.email}
            </span>
          )}
          {contact.phone && (
            <span className="flex items-center gap-1 truncate">
              <Phone className="h-3 w-3" />
              {contact.phone}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => { e.stopPropagation(); toggleFavorite(contact) }}
        >
          <Star className={cn(
            "h-4 w-4",
            contact.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
          )} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleOpenEdit(contact)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive"
          onClick={() => handleDelete(contact)}
          disabled={isLoading}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
            <p className="text-muted-foreground">
              Manage your payment contacts
            </p>
          </div>
          <Button onClick={handleOpenAdd}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {contacts.length === 0 ? (
          <Card>
            <CardContent className="p-12">
              <EmptyState
                icon={UserPlus}
                title="No contacts yet"
                description="Add contacts to quickly send money to people you frequently pay"
                action={
                  <Button onClick={handleOpenAdd}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Your First Contact
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <>
            {favoriteContacts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    Favorites ({favoriteContacts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {favoriteContacts.map(contact => (
                    <ContactCard key={contact.id} contact={contact} />
                  ))}
                </CardContent>
              </Card>
            )}

            {regularContacts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>All Contacts ({regularContacts.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {regularContacts.map(contact => (
                    <ContactCard key={contact.id} contact={contact} />
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account">Account Number</Label>
                <Input
                  id="account"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="1234567890"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="flex-1" 
                onClick={() => handleSubmit(false)}
                disabled={!formData.name || isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Contact
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Contact</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-account">Account Number</Label>
                <Input
                  id="edit-account"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="1234567890"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="flex-1" 
                onClick={() => handleSubmit(true)}
                disabled={!formData.name || isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
