import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import type { Contact } from '@/store/types';
import { useToast } from '@/components/ui/use-toast';
import { contactsApi } from '@/lib/api';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Search, UserPlus, Mail, Phone,
  Loader2, Users, User, Coins
} from 'lucide-react';

export default function ContactsPage() {
  const { contacts, setContacts, addContact } = useAppStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await contactsApi.getAll();
      if (active && result.data) setContacts(result.data);
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [setContacts]);

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery)
  );

  const handleOpenAdd = () => {
    setFormData({ name: '', email: '', phone: '' });
    setIsAddOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || (!formData.phone && !formData.email)) {
      toast({ title: 'Agrega un nombre y al menos un celular o correo', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const result = await contactsApi.create(formData);
    if (result.data) {
      addContact(result.data);
      toast({ title: '¡Contacto guardado con éxito!' });
      setIsAddOpen(false);
      setFormData({ name: '', email: '', phone: '' });
    } else {
      toast({ title: result.error || 'La operación falló', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const ContactCard = ({ contact }: { contact: Contact }) => (
    <div className="flex items-center justify-between p-4 bg-neutral-50/50 hover:bg-neutral-50 border border-neutral-100 rounded-2xl transition-all group">
      <div className="flex items-center gap-3.5 min-w-0">
        <span className="w-12 h-12 rounded-xl bg-primary/10 text-primary font-black flex items-center justify-center text-sm shrink-0">
          {contact.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="font-extrabold text-sm text-neutral-800 truncate">{contact.name}</p>
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
      <button
        onClick={() => navigate('/dashboard/requests/new')}
        className="shrink-0 px-3.5 py-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
        aria-label={`Crear cobro para ${contact.name}`}
      >
        <Coins className="h-3.5 w-3.5" />
        Cobrar
      </button>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-display text-neutral-800 tracking-tight">Directorio</h1>
          <p className="text-neutral-500 font-semibold text-sm mt-1">
            Guarda tus contactos frecuentes para crear cobros Pika al instante
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

      {loading ? (
        <LoadingState message="Cargando tu directorio..." />
      ) : contacts.length === 0 ? (
        <div className="bg-white border border-black/5 rounded-[32px] p-12 text-center flex flex-col items-center max-w-md mx-auto">
          <Users className="w-12 h-12 text-primary/25 mb-3" />
          <h4 className="text-sm font-extrabold text-neutral-700">Aún no tienes contactos</h4>
          <p className="text-xs text-neutral-400 leading-relaxed font-semibold max-w-xs mt-1 mb-6">
            Agrega tu primer contacto para mandarle un enlace de cobro al instante.
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
        <div className="bg-white border border-black/5 rounded-[32px] p-6 md:p-8 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-neutral-800">
            Contactos ({filteredContacts.length})
          </h3>
          {filteredContacts.length === 0 ? (
            <p className="text-xs text-neutral-400 font-semibold py-6 text-center">Sin resultados para “{searchQuery}”.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredContacts.map(contact => (
                <ContactCard key={contact.id} contact={contact} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ADD CONTACT DIALOG ── */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="rounded-[32px] max-w-sm p-6">
          <DialogHeader className="text-center flex flex-col items-center space-y-2">
            <User className="h-10 w-10 text-primary mb-1" />
            <DialogTitle className="text-lg font-black text-neutral-800">Nuevo Contacto</DialogTitle>
            <DialogDescription className="text-xs text-neutral-400 font-semibold">
              Completa los datos para vincular el contacto en Pika.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs font-semibold text-neutral-700 mt-4">
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
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setIsAddOpen(false)}
              className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold rounded-full text-xs transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.name || isLoading}
              className="flex-1 py-3 bg-primary hover:bg-primary/90 disabled:bg-neutral-100 disabled:text-neutral-400 text-white font-black rounded-full text-xs shadow transition-all flex items-center justify-center gap-1.5"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Guardar contacto
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
