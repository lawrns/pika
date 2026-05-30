import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  message?: string
  subtitle?: string
  icon?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingState({ message = 'Cargando...', subtitle, icon, size = 'md' }: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4">
      <div className="flex flex-col items-center gap-3">
        {icon || <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />}
        <p className="text-sm font-medium text-foreground">{message}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  )
}
