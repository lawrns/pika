import { useState } from 'react'
import { useAppStore } from '@/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { settingsApi } from '@/lib/api'
import { 
  User, Key, Bell, Shield, Eye, EyeOff, Loader2,
  Camera, Save, Check, AlertCircle
} from 'lucide-react'

export default function SettingsPage() {
  const { user, settings, updateSettings, setUser } = useAppStore()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [show2FADialog, setShow2FADialog] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  
  // Profile state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+52 55 1234 5678',
    bio: ''
  })
  
  // Password state
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  })

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'notifications', label: 'Notificaciones', icon: Bell }
  ]

  const handleProfileSave = async () => {
    setIsLoading(true)
    const result = await settingsApi.updateProfile({
      name: profileData.name,
      email: profileData.email
    })
    
    if (result.data) {
      setUser(result.data)
      toast({ title: '¡Perfil actualizado con éxito!' })
    } else {
      toast({ title: result.error || 'Error al actualizar el perfil', variant: 'destructive' })
    }
    setIsLoading(false)
  }

  const handlePasswordChange = async () => {
    if (passwordData.new !== passwordData.confirm) {
      toast({ title: 'Las contraseñas no coinciden', variant: 'destructive' })
      return
    }
    if (passwordData.new.length < 8) {
      toast({ title: 'La contraseña debe tener al menos 8 caracteres', variant: 'destructive' })
      return
    }
    
    setIsLoading(true)
    const result = await settingsApi.changePassword(passwordData.current, passwordData.new)
    
    if (result.message) {
      toast({ title: '¡Contraseña actualizada con éxito!' })
      setPasswordData({ current: '', new: '', confirm: '' })
    } else {
      toast({ title: result.error || 'Error al actualizar la contraseña', variant: 'destructive' })
    }
    setIsLoading(false)
  }

  const handle2FAToggle = async () => {
    if (!settings.twoFactorEnabled) {
      setShow2FADialog(true)
    } else {
      setIsLoading(true)
      const result = await settingsApi.disableTwoFactor(twoFactorCode)
      if (result.message) {
        updateSettings({ twoFactorEnabled: false })
        toast({ title: 'Autenticación de 2 factores desactivada' })
        setShow2FADialog(false)
      } else {
        toast({ title: result.error || 'Error al desactivar el 2FA', variant: 'destructive' })
      }
      setIsLoading(false)
    }
  }

  const handle2FAVerify = async () => {
    setIsLoading(true)
    const result = await settingsApi.verifyTwoFactor(twoFactorCode)
    if (result.message) {
      updateSettings({ twoFactorEnabled: true })
      toast({ title: '¡Autenticación de dos factores activada con éxito!' })
      setShow2FADialog(false)
      setTwoFactorCode('')
    } else {
      toast({ title: result.error || 'Código de verificación inválido', variant: 'destructive' })
    }
    setIsLoading(false)
  }

  const handleNotificationToggle = (key: string, value: boolean) => {
    updateSettings({ [key]: value })
    const notifyName = 
      key === 'emailNotifications' ? 'Correo electrónico' : 
      key === 'pushNotifications' ? 'Notificaciones push' : 
      key === 'smsNotifications' ? 'SMS' : 'Correos de marketing';
    toast({ title: `${notifyName} ${value ? 'activadas' : 'desactivadas'}` })
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* ── HEADER ── */}
      <div>
        <h1 className="text-3xl font-black font-display text-foreground tracking-tight">Ajustes</h1>
        <p className="text-muted-foreground font-semibold text-sm mt-1">
          Gestiona tu perfil, seguridad y preferencias de notificación
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1 border-border shadow-sm rounded-3xl overflow-hidden bg-card">
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
                      <AvatarFallback className="text-2xl font-black bg-primary/10 text-primary">
                        {profileData.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                        <div>
                          <Button variant="outline" size="sm" className="rounded-xl border-border text-foreground hover:bg-muted font-bold text-xs h-9">
                            <Camera className="mr-2 h-3.5 w-3.5" />
                            Cambiar Foto
                          </Button>
                          <p className="text-[10px] text-muted-foreground mt-1.5 font-semibold">
                            JPG, PNG o GIF. Máximo 2MB.
                          </p>
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
                          <Input
                            id="email"
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                            className="rounded-xl border-border focus:border-primary focus:ring-primary/20 font-semibold"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-xs font-bold text-muted-foreground">Número de Celular</Label>
                          <Input
                            id="phone"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                            className="rounded-xl border-border focus:border-primary focus:ring-primary/20 font-semibold"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio" className="text-xs font-bold text-muted-foreground">Acerca de ti (Bio)</Label>
                        <Textarea
                          id="bio"
                          value={profileData.bio}
                          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                          placeholder="Cuéntanos un poco sobre ti..."
                          rows={3}
                          className="rounded-xl border-border focus:border-primary focus:ring-primary/20 font-semibold resize-none"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border shadow-sm rounded-3xl overflow-hidden bg-card">
                    <CardHeader className="pb-4 border-b border-border">
                      <CardTitle className="text-lg font-black font-display text-foreground">Detalles de la Cuenta</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4">
                      <div className="flex justify-between py-2 border-b border-border/50 text-sm">
                        <span className="text-muted-foreground font-semibold">Miembro desde</span>
                        <span className="font-extrabold text-foreground/80">Enero 2024</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border/50 text-sm">
                        <span className="text-muted-foreground font-semibold">Tipo de Cuenta</span>
                        <span className="font-extrabold text-foreground/80">Personal</span>
                      </div>
                      <div className="flex justify-between py-2 text-sm items-center">
                        <span className="text-muted-foreground font-semibold">Estado de Verificación</span>
                        <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-extrabold rounded-full px-2.5 py-0.5 border-none">Verificado</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button 
                      onClick={handleProfileSave} 
                      disabled={isLoading}
                      className="px-6 py-3 bg-primary hover:bg-primary/90 active:scale-95 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-black rounded-full shadow-md transition-all flex items-center gap-1.5 h-11"
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary-foreground" />}
                      <Save className="h-4 w-4" />
                      Guardar Cambios
                    </Button>
                  </div>
                </>
              )}

              {activeTab === 'security' && (
                <>
                  <Card className="border-border shadow-sm rounded-3xl overflow-hidden bg-card">
                    <CardHeader className="pb-4 border-b border-border">
                      <CardTitle className="text-lg font-black font-display text-foreground">Cambiar Contraseña</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                      <div className="space-y-2">
                        <Label htmlFor="current-password" className="text-xs font-bold text-muted-foreground">Contraseña Actual</Label>
                        <div className="relative">
                          <Input
                            id="current-password"
                            type={showPassword ? 'text' : 'password'}
                            value={passwordData.current}
                            onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                            className="rounded-xl border-border focus:border-primary focus:ring-primary/20 font-semibold pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password" className="text-xs font-bold text-muted-foreground">Nueva Contraseña</Label>
                        <Input
                          id="new-password"
                          type={showPassword ? 'text' : 'password'}
                          value={passwordData.new}
                          onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                          className="rounded-xl border-border focus:border-primary focus:ring-primary/20 font-semibold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="text-xs font-bold text-muted-foreground">Confirmar Nueva Contraseña</Label>
                        <Input
                          id="confirm-password"
                          type={showPassword ? 'text' : 'password'}
                          value={passwordData.confirm}
                          onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                          className="rounded-xl border-border focus:border-primary focus:ring-primary/20 font-semibold"
                        />
                      </div>
                      <div className="bg-muted p-3 rounded-2xl text-[11px] text-muted-foreground font-semibold leading-relaxed flex gap-2 items-start">
                        <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <p>La contraseña debe tener al menos 8 caracteres de longitud e incluir una mezcla de letras, números y símbolos especiales.</p>
                      </div>
                      <Button 
                        onClick={handlePasswordChange} 
                        disabled={isLoading}
                        className="px-6 py-3 bg-primary hover:bg-primary/90 active:scale-95 text-primary-foreground font-extrabold rounded-full shadow-md transition-all flex items-center gap-1.5 h-11"
                      >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Actualizar Contraseña
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-border shadow-sm rounded-3xl overflow-hidden bg-card">
                    <CardHeader className="pb-4 border-b border-border">
                      <CardTitle className="text-lg font-black font-display text-foreground">Autenticación de Dos Factores (2FA)</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-extrabold text-sm text-foreground">Estado del 2FA</p>
                          <p className="text-xs text-muted-foreground font-semibold">
                            Añade una capa extra de protección de alta seguridad a tu cuenta
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {settings.twoFactorEnabled && (
                            <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-black rounded-full px-2.5 py-0.5 border-none flex items-center gap-1">
                              <Check className="h-3 w-3 stroke-[3]" />
                              Activado
                            </Badge>
                          )}
                          <Switch
                            checked={settings.twoFactorEnabled}
                            onCheckedChange={handle2FAToggle}
                            disabled={isLoading}
                            className="data-[state=checked]:bg-primary"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border shadow-sm rounded-3xl overflow-hidden bg-card">
                    <CardHeader className="pb-4 border-b border-border">
                      <CardTitle className="text-lg font-black font-display text-foreground">Sesiones Activas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                      <div className="flex items-center justify-between p-4 border border-border rounded-2xl bg-muted/20">
                        <div>
                          <p className="font-extrabold text-sm text-foreground">Sesión Actual</p>
                          <p className="text-xs text-muted-foreground font-semibold">Windows • Chrome • Ciudad de México</p>
                        </div>
                        <Badge className="bg-primary/10 hover:bg-primary/15 text-primary font-extrabold rounded-full border-none">Activa ahora</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 border border-border rounded-2xl bg-muted/20">
                        <div>
                          <p className="font-extrabold text-sm text-foreground">Dispositivo Móvil</p>
                          <p className="text-xs text-muted-foreground font-semibold">iOS • Safari • Hace 2 días</p>
                        </div>
                        <Button variant="ghost" className="text-xs font-bold text-muted-foreground hover:text-destructive rounded-full">Revocar</Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {activeTab === 'notifications' && (
                <>
                  <Card className="border-border shadow-sm rounded-3xl overflow-hidden bg-card">
                    <CardHeader className="pb-4 border-b border-border">
                      <CardTitle className="text-lg font-black font-display text-foreground">Preferencia de Notificaciones</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      {([
                        { key: 'emailNotifications', label: 'Notificaciones por Correo', desc: 'Alertas de movimientos y transacciones enviadas a tu buzón' },
                        { key: 'pushNotifications', label: 'Notificaciones Push', desc: 'Alertas instantáneas y confirmaciones directo en tu celular' },
                        { key: 'smsNotifications', label: 'Mensajes de Texto (SMS)', desc: 'Actualizaciones de seguridad críticas mediante mensajes SMS' },
                        { key: 'marketingEmails', label: 'Correos de Novedades y Marketing', desc: 'Mantente al tanto de nuevas funciones, beneficios y sorteos' }
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
                    </CardContent>
                  </Card>

                  <Card className="border-border shadow-sm rounded-3xl overflow-hidden bg-card">
                    <CardHeader className="pb-4 border-b border-border">
                      <CardTitle className="text-lg font-black font-display text-foreground">Alertas por Tipo de Evento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                      {[
                        { title: 'Cobro recibido', defaultOn: true },
                        { title: 'Pika enviado', defaultOn: true },
                        { title: 'Aviso de saldo bajo', defaultOn: true },
                        { title: 'Movimiento de monto elevado', defaultOn: true },
                        { title: 'Nuevo inicio de sesión', defaultOn: true },
                        { title: 'Cambio de contraseña', defaultOn: true }
                      ].map((alert) => (
                        <div key={alert.title} className="flex items-center justify-between py-2 border-b border-border last:border-none text-sm">
                          <span className="font-extrabold text-foreground/80">{alert.title}</span>
                          <Switch defaultChecked={alert.defaultOn} className="data-[state=checked]:bg-primary" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>

        <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent className="rounded-3xl border-none p-6 bg-card max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-black font-display text-foreground text-center">
              Activar Doble Factor (2FA)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!settings.twoFactorEnabled ? (
              <>
                <div className="text-center p-5 bg-muted rounded-2xl">
                  <p className="text-xs text-muted-foreground font-semibold mb-3 leading-relaxed">
                    Escanea este código QR con tu app de autenticación (Google Authenticator, Authy, etc.)
                  </p>
                  <div className="w-36 h-36 bg-background mx-auto rounded-2xl flex items-center justify-center shadow-sm border border-border">
                    <Key className="h-14 w-14 text-muted-foreground/60" />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-bold mt-3 uppercase tracking-wider">
                    O escribe esta clave: MOCK2FASECRET
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="2fa-code" className="text-xs font-bold text-muted-foreground">Código de Verificación</Label>
                  <Input
                    id="2fa-code"
                    placeholder="123456"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    maxLength={6}
                    className="rounded-xl text-center font-extrabold text-base border-border tracking-widest focus:border-primary focus:ring-primary/20 bg-background text-foreground"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1 rounded-full text-xs font-bold border-border text-muted-foreground hover:bg-muted" onClick={() => setShow2FADialog(false)}>
                    Cancelar
                  </Button>
                  <Button className="flex-1 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black shadow-md" onClick={handle2FAVerify} disabled={isLoading || twoFactorCode.length !== 6}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary-foreground" />}
                    Activar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="disable-2fa-code" className="text-xs font-bold text-muted-foreground">Ingresa tu código de 6 dígitos para desactivar 2FA</Label>
                  <Input
                    id="disable-2fa-code"
                    placeholder="123456"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    maxLength={6}
                    className="rounded-xl text-center font-extrabold text-base border-border tracking-widest focus:border-primary focus:ring-primary/20 bg-background text-foreground"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1 rounded-full text-xs font-bold border-border text-muted-foreground hover:bg-muted" onClick={() => setShow2FADialog(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1 rounded-full text-xs font-bold" 
                    onClick={handle2FAToggle}
                    disabled={isLoading || twoFactorCode.length !== 6}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Desactivar 2FA
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
