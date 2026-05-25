import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  Wallet,
  History,
  Send,
  QrCode,
  LayoutDashboard,
  Settings,
  HelpCircle,
  Menu,
  LogOut,
  User,
  Users
} from "lucide-react"
import { useAppStore } from "@/store"
import { PikaMark, Avatar } from "../pika/atoms"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed?: boolean
}

const sidebarNavItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { title: "Transactions", href: "/dashboard/transactions", icon: History },
  { title: "Send Money", href: "/dashboard/send", icon: Send },
  { title: "QR Code", href: "/dashboard/qr", icon: QrCode },
  { title: "Contacts", href: "/dashboard/contacts", icon: Users },
]

const sidebarSecondaryItems = [
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
  { title: "Help", href: "/dashboard/help", icon: HelpCircle },
]

export function Sidebar({ className, isCollapsed }: SidebarProps) {
  const location = useLocation()
  const { user, logout, contacts } = useAppStore()

  return (
    <div className={cn("pb-12 h-screen flex flex-col", className)}>
      <div className="space-y-4 py-4 flex-1">
        <div className="px-4 py-2">
          <Link to="/dashboard" className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <PikaMark size={20} color="#fff" />
            </div>
            {!isCollapsed && <span className="font-bold text-xl tracking-tight">Pika</span>}
          </Link>
        </div>
        
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1">
            {sidebarNavItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start rounded-xl transition-all border border-transparent font-medium",
                    isCollapsed && "justify-center px-2",
                    isActive
                      ? "border-primary bg-primary/5 text-primary hover:bg-primary/10 font-bold"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                  asChild
                >
                  <Link to={item.href}>
                    <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-2", isActive && "text-primary")} />
                    {!isCollapsed && (
                      <>
                        {item.title}
                        {item.href === '/dashboard/contacts' && contacts.length > 0 && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {contacts.length}
                          </Badge>
                        )}
                      </>
                    )}
                  </Link>
                </Button>
              );
            })}
          </div>
          
          <div className="mt-6">
            {!isCollapsed && (
              <h2 className="mb-2 px-2 text-xs font-semibold tracking-tight text-muted-foreground">
                Support
              </h2>
            )}
            <div className="space-y-1">
              {sidebarSecondaryItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start rounded-xl transition-all border border-transparent font-medium",
                      isCollapsed && "justify-center px-2",
                      isActive
                        ? "border-primary bg-primary/5 text-primary hover:bg-primary/10 font-bold"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                    asChild
                  >
                    <Link to={item.href}>
                      <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-2", isActive && "text-primary")} />
                      {!isCollapsed && item.title}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </div>
      
      <div className="px-4 py-4 border-t">
        <div className="flex items-center gap-3">
          <Avatar name={user?.name || user?.email || 'Guest'} size={32} />
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || 'Guest'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || 'Sign in'}</p>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function MobileSidebar() {
  const [open, setOpen] = React.useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <Sidebar />
      </SheetContent>
    </Sheet>
  )
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation()

  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/dashboard') return 'Dashboard'
    if (path === '/dashboard/wallet') return 'Wallet'
    if (path === '/dashboard/transactions') return 'Transactions'
    if (path === '/dashboard/send') return 'Send Money'
    if (path === '/dashboard/qr') return 'QR Payments'
    if (path === '/dashboard/contacts') return 'Contacts'
    if (path === '/dashboard/settings') return 'Settings'
    return 'Pika'
  }
  const isDashboardHome = location.pathname === '/dashboard' || location.pathname === '/dashboard/';

  return (
    <div className="flex min-h-screen bg-[#f7f5fa]">
      <aside className="hidden md:block w-64 shrink-0 border-r bg-background">
        <Sidebar />
      </aside>
      
      <div className="flex-1 flex flex-col min-w-0 bg-[#f7f5fa]">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-background sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <MobileSidebar />
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <PikaMark size={20} color="#fff" />
            </div>
            <span className="font-bold text-lg tracking-tight">{getPageTitle()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard/settings">
                <User className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </header>
        
        <main className={cn("flex-1 overflow-auto bg-[#f7f5fa]", !isDashboardHome && "p-4 md:p-8")}>
          <div className={cn("mx-auto", !isDashboardHome && "max-w-7xl")}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
