import * as React from 'react'
import { useParams, Link } from 'react-router-dom'
import { paymentLinksApi } from '@/lib/api'
import type { PublicPaymentLink } from '@/store/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, MessageCircle, ShieldCheck } from 'lucide-react'

function formatMXN(amount: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
}

export default function PublicPayPage() {
  const { referenceCode } = useParams()
  const [link, setLink] = React.useState<PublicPaymentLink | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [instructions, setInstructions] = React.useState<string | null>(null)
  const [payer, setPayer] = React.useState({ name: '', email: '', phone: '' })

  React.useEffect(() => {
    let mounted = true
    async function load() {
      if (!referenceCode) return
      setIsLoading(true)
      const result = await paymentLinksApi.getPublic(referenceCode)
      if (!mounted) return
      if (result.error) setError(result.error)
      else setLink(result.data || null)
      setIsLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [referenceCode])

  const whatsappText = encodeURIComponent(`Pago Pika ${referenceCode}: ${link?.paymentUrl || window.location.href}`)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!referenceCode) return
    setIsSubmitting(true)
    setError(null)
    const result = await paymentLinksApi.startPublicPayment(referenceCode, payer)
    if (result.error) setError(result.error)
    else setInstructions(result.data?.instructions || 'Solicitud registrada. El comercio recibirá la confirmación al reconciliar el pago.')
    setIsSubmitting(false)
  }

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center bg-muted/40"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (error && !link) {
    return <div className="min-h-screen grid place-items-center bg-muted/40 p-4"><Card className="max-w-md"><CardHeader><CardTitle>Link no disponible</CardTitle><CardDescription>{error}</CardDescription></CardHeader><CardFooter><Link to="/"><Button>Volver a Pika</Button></Link></CardFooter></Card></div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background p-4 flex items-center justify-center">
      <Card className="w-full max-w-lg border-border shadow-xl bg-card">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary text-primary-foreground grid place-items-center text-2xl font-black shadow-md shadow-primary/10">P</div>
          <CardTitle className="text-3xl text-foreground">Pagar con Pika</CardTitle>
          <CardDescription className="text-muted-foreground">Link de pago MXN para {link?.merchantName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-2xl border border-border bg-background p-5 text-center">
            <p className="text-sm text-muted-foreground">Monto</p>
            <p className="text-4xl font-black text-foreground">{formatMXN(link?.amount || 0)}</p>
            {link?.description && <p className="mt-2 text-sm text-muted-foreground">{link.description}</p>}
          </div>

          {instructions ? (
            <div className="rounded-xl border border-emerald-200/40 bg-emerald-50 dark:bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-400">
              <ShieldCheck className="mb-2 h-5 w-5" />
              {instructions}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Nombre</Label>
                <Input value={payer.name} onChange={e => setPayer({ ...payer, name: e.target.value })} placeholder="Tu nombre" className="border-border bg-background text-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Email</Label>
                <Input type="email" value={payer.email} onChange={e => setPayer({ ...payer, email: e.target.value })} placeholder="correo@ejemplo.com" className="border-border bg-background text-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">WhatsApp</Label>
                <Input value={payer.phone} onChange={e => setPayer({ ...payer, phone: e.target.value })} placeholder="+52..." className="border-border bg-background text-foreground" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Iniciar pago seguro
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <a className="w-full" href={`https://wa.me/?text=${whatsappText}`} target="_blank" rel="noreferrer">
            <Button variant="outline" className="w-full border-border hover:bg-muted text-foreground"><MessageCircle className="mr-2 h-4 w-4" />Compartir por WhatsApp</Button>
          </a>
          <p className="text-center text-[10px] text-muted-foreground leading-normal">Sandbox operativo: los fondos reales requieren webhook/reconciliación del proveedor antes de marcarse como completados.</p>
        </CardFooter>
      </Card>
    </div>
  )
}
