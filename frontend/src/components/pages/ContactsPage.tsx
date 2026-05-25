import { useState } from 'react';
import { useAppStore } from '@/store';
import type { Contact } from '@/store/types';
import { useToast } from '@/components/ui/use-toast';
import { contactsApi } from '@/lib/api';
import { 
  Search, UserPlus, Star, Mail, Phone,
  Edit, Trash2, Loader2, X, Users, User
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ContactsPage() {
  const { contacts, addContact, updateContact, removeContact } = useAppStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    accountNumber: '',
    isFavorite: false
  });

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery)
  );

  const favoriteContacts = filteredContacts.filter(c => c.isFavorite);
  const regularContacts = filteredContacts.filter(c => !c.isFavorite);

  const handleOpenAdd = () => {
    setFormData({ name: '', email: '', phone: '', accountNumber: '', isFavorite: false });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setFormData({
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      accountNumber: contact.accountNumber || '',
      isFavorite: contact.isFavorite || false
    });
    setIsEditOpen(true);
  };

  const handleSubmit = async (isEdit: boolean) => {
    setIsLoading(true);
    
    const result = isEdit
      ? await contactsApi.update(selectedContact!.id, formData)
      : await contactsApi.create(formData);
    
    if (result.data) {
      if (isEdit) {
        updateContact(selectedContact!.id, result.data);
        toast({ title: '¡Contacto actualizado con éxito!' });
      } else {
        addContact(result.data);
        toast({ title: '¡Contacto guardado con éxito!' });
      }
      setIsAddOpen(false);
      setIsEditOpen(false);
      setSelectedContact(null);
      setFormData({ name: '', email: '', phone: '', accountNumber: '', isFavorite: false });
    } else {
      toast({ title: result.error || 'La operación falló', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handleDelete = async (contact: Contact) => {
    setIsLoading(true);
    const result = await contactsApi.delete(contact.id);
    if (result.data !== undefined) {
      removeContact(contact.id);
      toast({ title: 'Contacto eliminado' });
    }
    setIsLoading(false);
  };

  const toggleFavorite = async (contact: Contact) => {
    const result = await contactsApi.update(contact.id, { isFavorite: !contact.isFavorite });
    if (result.data) {
      updateContact(contact.id, { isFavorite: !contact.isFavorite });
    }
  };

  const ContactCard = ({ contact }: { contact: Contact }) => (
    <div className="flex items-center justify-between p-4 bg-neutral-50/50 hover:bg-neutral-50 border border-neutral-100 rounded-2xl transition-all group">
      <div className="flex items-center gap-3.5 min-w-0">
        <span className="w-12 h-12 rounded-xl bg-primary/10 text-primary font-black flex items-center justify-center text-sm shrink-0">
          {contact.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-extrabold text-sm text-neutral-800 truncate">{contact.name}</p>
            {contact.isFavorite && <Star className="h-3 w-3 fill-amber-500 text-amber-500 shrink-0" />}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-neutral-400 font-semibold mt-0.5">
            {contact.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3 text-neutral-400" />
                {contact.phone}
              </span>
            )}
            {contact.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3 text-neutral-400" />
                {contact.email}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(contact); }}
          className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center transition-all"
        >
          <Star className={cn(
            "h-4 w-4 transition-all",
            contact.isFavorite ? "fill-amber-500 text-amber-500" : "text-neutral-400"
          )} />
        </button>
        <button
          onClick={() => handleOpenEdit(contact)}
          className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500 transition-all"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleDelete(contact)}
          disabled={isLoading}
          className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-red-500 transition-all"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-display text-neutral-800 tracking-tight">Directorio</h1>
          <p className="text-neutral-500 font-semibold text-sm mt-1">
            Gestiona tus contactos frecuentes para enviar y cobrar cobros SPEI rápidamente
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-6 py-3.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-full text-xs shadow-md transition-all active:scale-95 flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4 stroke-[3.5]" />
          Nuevo Contacto
        </button>
      </div>

      {/* ── SEARCH PANEL ── */}
      <div className="bg-white border border-black/5 rounded-3xl p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            placeholder="Buscar por nombre, celular o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 rounded-full text-xs font-semibold outline-none transition-all placeholder:text-neutral-400"
          />
        </div>
      </div>

      {contacts.length === 0 ? (
        <div className="bg-white border border-black/5 rounded-[32px] p-12 text-center flex flex-col items-center max-w-md mx-auto">
          <Users className="w-12 h-12 text-primary/25 mb-3" />
          <h4 className="text-sm font-extrabold text-neutral-700">Aún no tienes contactos</h4>
          <p className="text-xs text-neutral-400 leading-relaxed font-semibold max-w-xs mt-1 mb-6">
            Agrega tu primer contacto para poder enviarle lana o mandarle un enlace de cobro al instante.
          </p>
          <button
            onClick={handleOpenAdd}
            className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white font-black rounded-full text-xs shadow transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            <UserPlus className="h-4 w-4 stroke-[3.5]" />
            Agregar mi primer contacto
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {favoriteContacts.length > 0 && (
            <div className="bg-white border border-black/5 rounded-[32px] p-6 md:p-8 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-neutral-800 flex items-center gap-2">
                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                Favoritos ({favoriteContacts.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {favoriteContacts.map(contact => (
                  <ContactCard key={contact.id} contact={contact} />
                ))}
              </div>
            </div>
          )}

          {regularContacts.length > 0 && (
            <div className="bg-white border border-black/5 rounded-[32px] p-6 md:p-8 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-neutral-800">
                Contactos ({regularContacts.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {regularContacts.map(contact => (
                  <ContactCard key={contact.id} contact={contact} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ADD NEW MODAL ── */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-[32px] w-full max-w-sm p-6 shadow-2xl relative border border-neutral-100">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-center mb-6 flex flex-col items-center">
              <User className="h-10 w-10 text-primary mb-2" />
              <h3 className="text-lg font-black text-neutral-800 mt-2">Nuevo Contacto</h3>
              <p className="text-xs text-neutral-400 mt-1 font-semibold">
                Completa los datos para vincular el contacto en Pika.
              </p>
            </div>
            <div className="space-y-4 py-2 text-xs font-semibold text-neutral-700">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">Nombre Completo *</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ej. Carlos Reyes"
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-full outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">Número de Celular</label>
                <input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="ej. +52 55 1234 5678"
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-full outline-none font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ej. carlos@ejemplo.com"
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-full outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">Número CLABE (18 dígitos)</label>
                <input
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="ej. 012180004582..."
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-full outline-none font-mono tracking-widest"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setIsAddOpen(false)}
                className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold rounded-full text-xs transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleSubmit(false)}
                disabled={!formData.name || isLoading}
                className="flex-1 py-3 bg-primary hover:bg-primary/90 disabled:bg-neutral-100 disabled:text-neutral-400 text-white font-black rounded-full text-xs shadow transition-all flex items-center justify-center gap-1.5"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Guardar contacto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-[32px] w-full max-w-sm p-6 shadow-2xl relative border border-neutral-100">
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-center mb-6 flex flex-col items-center">
              <User className="h-10 w-10 text-primary mb-2" />
              <h3 className="text-lg font-black text-neutral-800 mt-2">Editar Contacto</h3>
              <p className="text-xs text-neutral-400 mt-1 font-semibold">
                Actualiza la información del contacto.
              </p>
            </div>
            <div className="space-y-4 py-2 text-xs font-semibold text-neutral-700">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">Nombre Completo *</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ej. Carlos Reyes"
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-full outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">Número de Celular</label>
                <input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="ej. +52 55 1234 5678"
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-full outline-none font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ej. carlos@ejemplo.com"
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-full outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">Número CLABE (18 dígitos)</label>
                <input
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="ej. 012180004582..."
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-full outline-none font-mono tracking-widest"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setIsEditOpen(false)}
                className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold rounded-full text-xs transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleSubmit(true)}
                disabled={!formData.name || isLoading}
                className="flex-1 py-3 bg-primary hover:bg-primary/90 disabled:bg-neutral-100 disabled:text-neutral-400 text-white font-black rounded-full text-xs shadow transition-all flex items-center justify-center gap-1.5"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
