import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download, QrCode } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import QRCode from 'qrcode'

export function QRCodeGenerator() {
  const [text, setText] = useState('https://pika.pay/pay')
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    generateQRCode()
  }, [])

  const generateQRCode = async (customText?: string) => {
    const textToEncode = customText || text
    if (!textToEncode) return

    try {
      const canvas = canvasRef.current
      if (canvas) {
        await QRCode.toCanvas(canvas, textToEncode, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        setQrDataUrl(canvas.toDataURL())
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate QR code.',
        variant: 'destructive'
      })
    }
  }

  const handleDownload = () => {
    if (!qrDataUrl) return

    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = 'pika-payment-qr.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Downloaded!',
      description: 'QR code saved to your device.'
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Code Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="qr-text">Payment Link or Text</Label>
          <div className="flex gap-2">
            <Input
              id="qr-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text or URL"
            />
            <Button onClick={() => generateQRCode()} variant="outline">
              Generate
            </Button>
          </div>
        </div>

        {qrDataUrl && (
          <div className="flex flex-col items-center gap-4 p-4 border rounded-lg">
            <canvas ref={canvasRef} className="hidden" />
            <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
            <Button onClick={handleDownload} variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download QR Code
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
