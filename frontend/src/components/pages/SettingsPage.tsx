import { useState } from 'react'
import { useAppStore } from '@/store'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
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
    phone: '+1 234 567 8900',
    bio: ''
  })
  
  // Password state
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  })

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ]

  const handleProfileSave = async () => {
    setIsLoading(true)
    const result = await settingsApi.updateProfile({
      name: profileData.name,
      email: profileData.email
    })
    
    if (result.data) {
      setUser(result.data)
      toast({ title: 'Profile updated successfully!' })
    } else {
      toast({ title: result.error || 'Update failed', variant: 'destructive' })
    }
    setIsLoading(false)
  }

  const handlePasswordChange = async () => {
    if (passwordData.new !== passwordData.confirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' })
      return
    }
    if (passwordData.new.length < 8) {
      toast({ title: 'Password must be at least 8 characters', variant: 'destructive' })
      return
    }
    
    setIsLoading(true)
    const result = await settingsApi.changePassword(passwordData.current, passwordData.new)
    
    if (result.message) {
      toast({ title: 'Password changed successfully!' })
      setPasswordData({ current: '', new: '', confirm: '' })
    } else {
      toast({ title: result.error || 'Failed to change password', variant: 'destructive' })
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
        toast({ title: '2FA disabled' })
        setShow2FADialog(false)
      } else {
        toast({ title: result.error || 'Failed to disable 2FA', variant: 'destructive' })
      }
      setIsLoading(false)
    }
  }

  const handle2FAVerify = async () => {
    setIsLoading(true)
    const result = await settingsApi.verifyTwoFactor(twoFactorCode)
    if (result.message) {
      updateSettings({ twoFactorEnabled: true })
      toast({ title: '2FA enabled successfully!' })
      setShow2FADialog(false)
      setTwoFactorCode('')
    } else {
      toast({ title: result.error || 'Invalid code', variant: 'destructive' })
    }
    setIsLoading(false)
  }

  const handleNotificationToggle = (key: string, value: boolean) => {
    updateSettings({ [key]: value })
    toast({ title: `${key} notifications ${value ? 'enabled' : 'disabled'}` })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          <Card className="lg:col-span-1">
            <CardContent className="p-4">
              <nav className="space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>

          <div className="lg:col-span-3 space-y-6">
            {activeTab === 'profile' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                          {profileData.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Button variant="outline" size="sm">
                          <Camera className="mr-2 h-4 w-4" />
                          Change Photo
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">
                          JPG, PNG or GIF. Max 2MB.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        placeholder="Tell us about yourself"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Account Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Member Since</span>
                      <span className="font-medium">January 2024</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Account Type</span>
                      <span className="font-medium">Personal</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Status</span>
                      <Badge className="bg-green-100 text-green-700">Verified</Badge>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button onClick={handleProfileSave} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </>
            )}

            {activeTab === 'security' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showPassword ? 'text' : 'password'}
                          value={passwordData.current}
                          onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.new}
                        onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.confirm}
                        onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                      />
                    </div>
                    <div className="bg-muted p-3 rounded-lg text-sm">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="text-muted-foreground">
                          Password must be at least 8 characters and include a mix of letters, numbers, and symbols.
                        </p>
                      </div>
                    </div>
                    <Button onClick={handlePasswordChange} disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Update Password
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Two-Factor Authentication</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">2FA Status</p>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {settings.twoFactorEnabled && (
                          <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Enabled
                          </Badge>
                        )}
                        <Switch
                          checked={settings.twoFactorEnabled}
                          onCheckedChange={handle2FAToggle}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sessions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Current Session</p>
                        <p className="text-sm text-muted-foreground">Windows • Chrome • Mexico City</p>
                      </div>
                      <Badge variant="secondary">Active Now</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Mobile Device</p>
                        <p className="text-sm text-muted-foreground">iOS • Safari • 2 days ago</p>
                      </div>
                      <Button variant="ghost" size="sm">Revoke</Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {activeTab === 'notifications' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {[
                      { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive transaction alerts via email' },
                      { key: 'pushNotifications', label: 'Push Notifications', desc: 'Get instant alerts on your device' },
                      { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive important updates via text' },
                      { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Receive promotional content and offers' }
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{label}</p>
                          <p className="text-sm text-muted-foreground">{desc}</p>
                        </div>
                        <Switch
                          checked={settings[key] as unknown as boolean[key]}
                          onCheckedChange={(value) => handleNotificationToggle(key, value)}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Alert Types</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      'Payment received',
                      'Payment sent',
                      'Low balance warning',
                      'Large transaction alert',
                      'New login detected',
                      'Password changed'
                    ].map((alert) => (
                      <div key={alert} className="flex items-center justify-between py-2">
                        <span className="text-sm">{alert}</span>
                        <Switch defaultChecked={true} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!settings.twoFactorEnabled ? (
              <>
                <div className="text-center p-6 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Scan this QR code with your authenticator app</p>
                  <div className="w-40 h-40 bg-white mx-auto rounded flex items-center justify-center">
                    <Key className="h-16 w-16 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Or enter code: MOCK2FASECRET</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="2fa-code">Verification Code</Label>
                  <Input
                    id="2fa-code"
                    placeholder="123456"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    maxLength={6}
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShow2FADialog(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handle2FAVerify} disabled={isLoading || twoFactorCode.length !== 6}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify & Enable
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="disable-2fa-code">Enter code to disable 2FA</Label>
                  <Input
                    id="disable-2fa-code"
                    placeholder="123456"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    maxLength={6}
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShow2FADialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1" 
                    onClick={handle2FAToggle}
                    disabled={isLoading || twoFactorCode.length !== 6}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Disable 2FA
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
