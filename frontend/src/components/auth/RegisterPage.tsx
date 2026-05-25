import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAppStore } from "@/store"
import { authApi } from "@/lib/api"
import { Eye, EyeOff, Loader2, User, KeyRound, Mail, ArrowRight } from "lucide-react"
import { PikaWordmark, Confetti } from "@/components/pika/atoms"

export function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAppStore()
  const [isLoading, setIsLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [agreedToTerms, setAgreedToTerms] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    const result = await authApi.register(name, email, password)
    if (result.error || !result.data) {
      setError(result.error || 'No se pudo crear la cuenta. Intenta de nuevo.')
      setIsLoading(false)
      return
    }
    login(result.data.user, result.data.token)
    setIsLoading(false)
    navigate("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#6419D6] via-[#7B2FF2] to-[#4F12B8] p-4 relative overflow-hidden font-sans">
      {/* Confetti backdrop layer */}
      <Confetti seed={15} density={70} />

      {/* Background ambient light */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-[#FFC52E]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[#FF3D8A]/10 blur-[130px] pointer-events-none" />

      {/* Main glass card */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-[32px] p-8 shadow-2xl relative z-10 text-white animate-fade-in">
        <div className="flex flex-col items-center mb-6">
          <PikaWordmark height={40} color="#fff" />
          <h2 className="text-3xl font-black font-display text-center tracking-tight mt-6 mb-1 text-white">
            Crea tu cuenta
          </h2>
          <p className="text-white/80 font-medium text-center text-sm max-w-[280px]">
            Olvídate de las comisiones y cobra al instante
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-black uppercase tracking-wider text-white/80 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Nombre Completo
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Juan Pérez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-12 bg-white/10 hover:bg-white/15 border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-white/20 rounded-2xl pl-4 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-black uppercase tracking-wider text-white/80 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Correo Electrónico
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="nombre@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 bg-white/10 hover:bg-white/15 border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-white/20 rounded-2xl pl-4 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-black uppercase tracking-wider text-white/80 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              Contraseña
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Crea una contraseña segura"
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
            <p className="text-[10px] text-white/60 font-semibold pl-1">
              Debe tener al menos 8 caracteres de longitud.
            </p>
          </div>

          <div className="flex items-start space-x-2 pt-2 pb-1">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              required
              className="border-white/20 mt-0.5 data-[state=checked]:bg-[#FFC52E] data-[state=checked]:text-[#17102A]"
            />
            <Label htmlFor="terms" className="text-[11px] font-semibold text-white/85 leading-normal cursor-pointer select-none">
              Acepto los{" "}
              <Link to="/terms" className="text-[#FFC52E] hover:underline font-bold">
                Términos de Servicio
              </Link>{" "}
              y la{" "}
              <Link to="/privacy" className="text-[#FFC52E] hover:underline font-bold">
                Política de Privacidad
              </Link>
            </Label>
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
              disabled={isLoading || !agreedToTerms}
              className="w-full h-12 bg-[#FFC52E] hover:bg-[#FFD65C] active:scale-[0.98] disabled:bg-white/10 disabled:text-white/40 text-[#17102A] font-black rounded-full shadow-lg hover:shadow-[#FFC52E]/10 transition-all flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#17102A]" />
              ) : (
                <>
                  Crear mi cuenta ⚡
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-white/10 text-center text-xs font-semibold">
          <p className="text-white/70">
            ¿Ya tienes una cuenta?{" "}
            <Link to="/login" className="text-[#FFC52E] hover:text-[#ffd361] font-black inline-flex items-center gap-0.5 hover:underline ml-1">
              Inicia sesión aquí <ArrowRight className="w-3 h-3" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
