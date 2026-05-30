import { useEffect, useState } from 'react'
import { useAppStore } from '@/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/use-toast'
import { profileApi, receivingAccountsApi, type ReceivingAccount } from '@/lib/api'
import { LoadingState } from '@/components/ui/loading-state'
import {
  User, Bell, Landmark, Loader2, Save, Check, Lock, Plus, ShieldCheck
} from 'lucide-react'

export default function SettingsPage() {
  const { user, settings, updateSettings, setUser } = useAppStore()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState('profile')
  const [isSaving, setIsSaving] = useState(false)

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  })

  // Receiving accounts (CLABE / DiMo)
  const [accounts, setAccounts] = useState<ReceivingAccount[]>([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [newType, setNewType] = useState<'clabe' | 'dimo_phone'>('clabe')
  const [newIdentifier, setNewIdentifier] = useState('')
  const [addingAccount, setAddingAccount] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      const [profileRes, accountsRes] = await Promise.all([profileApi.get(), receivingAccountsApi.list()])
      if (!active) return
      if (profileRes.data) {
        setProfileData((prev) => ({
          name: profileRes.data!.name || prev.name,
          email: profileRes.data!.email || prev.email,
          phone: profileRes.data!.phone || prev.phone
        }))
      }
      if (accountsRes.data) setAccounts(accountsRes.data)
      setAccountsLoading(false)
    })()
    return () => { active = false }
  }, [])

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'accounts', label: 'Cuentas de cobro', icon: Landmark },
    { id: 'notifications', label: 'Notificaciones', icon: Bell }
  ]

  const handleProfileSave = async () => {
    setIsSaving(true)
    const result = await profileApi.update({ displayName: profileData.name, phone: profileData.phone })
    if (result.data) {
      setUser({ ...(user as any), name: result.data.name, phone: result.data.phone })
      toast({ title: '¡Perfil actualizado con éxito!' })
    } else {
      toast({ title: result.error || 'Error al actualizar el perfil', variant: 'destructive' })
    }
    setIsSaving(false)
  }

  const handleAddAccount = async () => {
    const digits = newIdentifier.replace(/\D/g, '')
    if (newType === 'clabe' && digits.length !== 18) {
      toast({ title: 'La CLABE debe tener exactamente 18 dígitos', variant: 'destructive' })
      return
    }
    if (newType === 'dimo_phone' && digits.length < 10) {
      toast({ title: 'Ingresa un número de celular válido (10 dígitos)', variant: 'destructive' })
      return
    }
    setAddingAccount(true)
    const result = await receivingAccountsApi.create(newType, digits)
    if (result.data) {
      setAccounts((prev) => [...prev, result.data!])
      setNewIdentifier('')
      toast({ title: '¡Cuenta de cobro vinculada!' })
    } else {
      toast({ title: result.error || 'No se pudo registrar la cuenta', variant: 'destructive' })
    }
    setAddingAccount(false)
  }

  const handleNotificationToggle = (key: keyof typeof settings, value: boolean) => {
    updateSettings({ [key]: value })
    const notifyName =
      key === 'emailNotifications' ? 'Correo electrónico' :
      key === 'pushNotifications' ? 'Notificaciones push' :
      key === 'smsNotifications' ? 'SMS' : 'Correos de novedades'
    toast({ title: `${notifyName} ${value ? 'activadas' : 'desactivadas'}` })
  }

  const initials = (profileData.name || 'P').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-black font-display text-foreground tracking-tight">Ajustes</h1>
        <p className="text-muted-foreground font-semibold text-sm mt-1">
          Gestiona tu perfil, tus cuentas de cobro y tus preferencias
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1 border-border shadow-sm rounded-3xl overflow-hidden bg-card h-fit">
          <CardContent className="p-3">
            <nav className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground font-extrabold shadow-md shadow-primary/10'
                      : 'hover:bg-muted text-muted-foreground font-bold hover:text-foreground'
                  }`}
                >
                  <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                  <span className="text-sm">{tab.label}</span>
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'profile' && (
            <>
              <Card className="border-border shadow-sm rounded-3xl overflow-hidden bg-card">
                <CardHeader className="pb-4 border-b border-border">
                  <CardTitle className="text-lg font-black font-display text-foreground">Información del Perfil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 border border-border shadow-sm">
                      <AvatarFallback className="text-2xl font-black bg-primary/10 text-primary">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-extrabold text-foreground">{profileData.name || 'Tu nombre'}</p>
                      <p className="text-xs text-muted-foreground font-semibold mt-0.5">{profileData.email}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs font-bold text-muted-foreground">Nombre Completo</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="rounded-xl border-border focus:border-primary focus:ring-primary/20 font-semibold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-bold text-muted-foreground">Correo Electrónico</Label>
                      <Input id="email" type="email" value={profileData.email} disabled className="rounded-xl border-border font-semibold bg-muted/40 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs font-bold text-muted-foreground">Número de Celular</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        placeholder="+52 55 1234 5678"
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="rounded-xl border-border focus:border-primary focus:ring-primary/20 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleProfileSave}
                      disabled={isSaving}
                      className="px-6 py-3 bg-primary hover:bg-primary/90 active:scale-95 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-black rounded-full shadow-md transition-all flex items-center gap-1.5 h-11"
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Guardar Cambios
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'accounts' && (
            <>
              <Card className="border-border shadow-sm rounded-3xl overflow-hidden bg-card">
                <CardHeader className="pb-4 border-b border-border">
                  <CardTitle className="text-lg font-black font-display text-foreground">Cuentas para recibir cobros</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="bg-muted/40 border border-border rounded-2xl p-3 text-[11px] text-muted-foreground font-semibold leading-relaxed flex gap-2 items-start">
                    <Lock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>Pika solo orquesta las transferencias directas a tu banco. Guardamos tu CLABE de forma enmascarada y tokenizada; nunca exponemos el número completo.</span>
                  </div>

                  {accountsLoading ? (
                    <div className="flex items-center justify-center py-6"><LoadingState size="sm" message="Cargando cuentas..." /></div>
                  ) : accounts.length === 0 ? (
                    <p className="text-xs text-muted-foreground font-semibold text-center py-4">Aún no has vinculado una cuenta de cobro.</p>
                  ) : (
                    <div className="space-y-2">
                      {accounts.map((acc) => (
                        <div key={acc.accountId} className="flex items-center justify-between p-4 border border-border rounded-2xl bg-muted/20">
                          <div className="flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                              <Landmark className="h-5 w-5" />
                            </span>
                            <div>
                              <p className="font-extrabold text-sm text-foreground">{acc.accountType === 'clabe' ? 'CLABE' : 'DiMo'}</p>
                              <p className="text-xs text-muted-foreground font-mono font-semibold">{acc.maskedIdentifier}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {acc.isDefault && <Badge className="bg-primary/10 text-primary font-extrabold rounded-full border-none text-[10px]">Principal</Badge>}
                            {acc.verificationStatus === 'verified' && (
                              <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-black rounded-full px-2.5 py-0.5 border-none flex items-center gap-1 text-[10px]">
                                <ShieldCheck className="h-3 w-3" /> Verificada
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm rounded-3xl overflow-hidden bg-card">
                <CardHeader className="pb-4 border-b border-border">
                  <CardTitle className="text-lg font-black font-display text-foreground">Vincular nueva cuenta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setNewType('clabe'); setNewIdentifier('') }}
                      className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all ${newType === 'clabe' ? 'bg-primary text-primary-foreground shadow' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
                    >
                      CLABE interbancaria
                    </button>
                    <button
                      onClick={() => { setNewType('dimo_phone'); setNewIdentifier('') }}
                      className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all ${newType === 'dimo_phone' ? 'bg-primary text-primary-foreground shadow' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
                    >
                      DiMo (celular)
                    </button>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground">
                      {newType === 'clabe' ? 'CLABE (18 dígitos)' : 'Número de celular (10 dígitos)'}
                    </Label>
                    <Input
                      value={newIdentifier}
                      onChange={(e) => setNewIdentifier(e.target.value.replace(/\D/g, ''))}
                      maxLength={newType === 'clabe' ? 18 : 10}
                      placeholder={newType === 'clabe' ? '000000000000000000' : '5512345678'}
                      className="rounded-xl border-border focus:border-primary focus:ring-primary/20 font-mono font-bold tracking-widest"
                    />
                  </div>
                  <Button
                    onClick={handleAddAccount}
                    disabled={addingAccount || !newIdentifier}
                    className="w-full px-6 py-3 bg-primary hover:bg-primary/90 active:scale-95 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-black rounded-full shadow-md transition-all flex items-center justify-center gap-1.5 h-11"
                  >
                    {addingAccount ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 stroke-[3]" />}
                    Vincular cuenta
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'notifications' && (
            <Card className="border-border shadow-sm rounded-3xl overflow-hidden bg-card">
              <CardHeader className="pb-4 border-b border-border">
                <CardTitle className="text-lg font-black font-display text-foreground">Preferencias de Notificación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {([
                  { key: 'emailNotifications', label: 'Notificaciones por Correo', desc: 'Avisos cuando te pagan un cobro Pika' },
                  { key: 'pushNotifications', label: 'Notificaciones Push', desc: 'Alertas instantáneas en tu dispositivo' },
                  { key: 'smsNotifications', label: 'Mensajes de Texto (SMS)', desc: 'Avisos de seguridad mediante SMS' },
                  { key: 'marketingEmails', label: 'Novedades de Pika', desc: 'Nuevas funciones y consejos para cobrar mejor' }
                ] as Array<{ key: keyof typeof settings; label: string; desc: string }>).map(({ key, label, desc }) => (
                  <div key={key} className="flex items-start justify-between py-1">
                    <div className="space-y-1 pr-4">
                      <p className="font-extrabold text-sm text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground font-semibold leading-relaxed">{desc}</p>
                    </div>
                    <Switch
                      checked={Boolean(settings[key])}
                      onCheckedChange={(value) => handleNotificationToggle(key, value)}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                ))}
                <div className="bg-muted/40 border border-border rounded-2xl p-3 text-[11px] text-muted-foreground font-semibold leading-relaxed flex gap-2 items-start">
                  <Check className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>Tus preferencias se guardan en este dispositivo.</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
