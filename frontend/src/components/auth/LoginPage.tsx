import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAppStore } from "@/store"
import { authApi } from "@/lib/api"
import { Eye, EyeOff, Loader2, KeyRound, Mail, ArrowRight, Zap } from "lucide-react"
import { PikaWordmark, Confetti } from "@/components/pika/atoms"

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAppStore()
  const [isLoading, setIsLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [rememberMe, setRememberMe] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    const result = await authApi.login(email, password)
    if (result.error || !result.data) {
      setError(result.error || 'Correo o contraseña incorrectos')
      setIsLoading(false)
      return
    }
    login(result.data.user, result.data.token)
    setIsLoading(false)
    navigate("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950/40 to-zinc-950 p-4 relative overflow-hidden font-sans">
      {/* Confetti layout layer */}
      <Confetti seed={12} density={70} />

      {/* Background ambient light */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none" />

      {/* Main glass card */}
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl relative z-10 text-white animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <PikaWordmark height={40} color="#fff" />
          <h2 className="text-3xl font-black font-display text-center tracking-tight mt-6 mb-1 text-white">
            ¡Hola de nuevo!
          </h2>
          <p className="text-white/80 font-medium text-center text-sm max-w-[280px]">
            Ingresa a tu cuenta Pika y manda o cobra al instante
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-black uppercase tracking-wider text-white/80 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Correo Electrónico
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="nombre@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-white/10 hover:bg-white/15 border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-white/20 rounded-2xl pl-4 pr-4 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-black uppercase tracking-wider text-white/80 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              Contraseña
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 bg-white/10 hover:bg-white/15 border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-white/20 rounded-2xl pl-4 pr-12 transition-all"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-white/70" />
                ) : (
                  <Eye className="h-4 w-4 text-white/70" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-bold pt-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-zinc-950"
              />
              <Label htmlFor="remember" className="text-white/95 hover:text-white cursor-pointer select-none">
                Recordar sesión
              </Label>
            </div>
            <Link to="/forgot-password" className="text-white/80 hover:text-white hover:underline transition-colors">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-100 rounded-xl p-3 text-xs font-bold flex items-center gap-2 animate-shake">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              {error}
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-white hover:bg-white/90 active:scale-[0.98] disabled:bg-white/10 disabled:text-white/40 text-zinc-950 font-black rounded-full shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
              ) : (
                <span className="flex items-center gap-1.5">
                  Iniciar sesión <Zap className="h-4 w-4 shrink-0 fill-current text-zinc-950" />
                </span>
              )}
            </Button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs font-semibold">
          <p className="text-white/70">
            ¿Aún no tienes cuenta?{" "}
            <Link to="/register" className="text-white hover:underline font-black inline-flex items-center gap-0.5 ml-1">
              Regístrate gratis <ArrowRight className="w-3 h-3" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
