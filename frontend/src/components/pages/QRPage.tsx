import { useState, useRef } from 'react'
import { useAppStore } from '@/store'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { qrApi } from '@/lib/api'
import { 
  QrCode, Scan, Download, Share2, Clock, Check,
  Camera, X, Wallet, History
} from 'lucide-react'
import QRCodeLib from 'qrcode'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function QRPage() {
  const { user } = useAppStore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('scan')
  
  const [qrAmount, setQrAmount] = useState('')
  const [qrDescription, setQrDescription] = useState('')
  const [generatedQR, setGeneratedQR] = useState<string | null>(null)
  const [qrExpiry, setQrExpiry] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [isScanning, setIsScanning] = useState(false)
  const [scannedData, setScannedData] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<{
    type: string
    amount?: number
    description?: string
    recipient?: string
    action: string
  } | null>(null)
  
  const [qrHistory, setQrHistory] = useState<Array<{
    id: string
    amount: number
    description?: string
    createdAt: string
    expiresAt: string
  }>>([])

  const handleGenerateQR = async () => {
    setIsGenerating(true)
    const amount = parseFloat(qrAmount)
    
    const result = await qrApi.generatePaymentQR(
      isNaN(amount) ? 0 : amount,
      qrDescription
    )
    
    if (result.data) {
      const qrResult = result.data
      setQrExpiry(qrResult.expiresAt)
      
      if (canvasRef.current) {
        const qrPayload = qrResult.qrData
        await QRCodeLib.toCanvas(canvasRef.current, qrPayload, {
          width: 280,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        setGeneratedQR(canvasRef.current.toDataURL())
      }
      
      setQrHistory(prev => [{
        id: Date.now().toString(),
        amount: amount || 0,
        description: qrDescription,
        createdAt: new Date().toISOString(),
        expiresAt: qrResult.expiresAt
      }, ...prev])
      
      toast({ title: 'QR Code generated!' })
    }
    setIsGenerating(false)
  }

  const handleDownloadQR = () => {
    if (!generatedQR) return
    
    const link = document.createElement('a')
    link.href = generatedQR
    link.download = `pika-qr-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({ title: 'QR Code downloaded!' })
  }

  const handleShareQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pika Payment',
          text: `Pay me ${qrAmount ? formatCurrency(parseFloat(qrAmount)) : 'any amount'} via Pika`
        })
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(`pika.pay/u/${user?.email}`)
      toast({ title: 'Link copied to clipboard!' })
    }
  }

  const startScanning = () => {
    setIsScanning(true)
    setScannedData(null)
    setScanResult(null)
  }

  const stopScanning = () => {
    setIsScanning(false)
  }

  const simulateScan = async () => {
    const mockQR = JSON.stringify({
      type: 'pika_payment',
      id: 'pay-demo-' + Date.now(),
      amount: 50,
      description: 'Demo payment',
      recipient: 'demo@pika.pay'
    })
    
    handleScan(mockQR)
  }

  const handleScan = async (data: string) => {
    setScannedData(data)
    setIsScanning(false)
    
    const result = await qrApi.scanAndProcess(data)
    if (result.data) {
      setScanResult(result.data)
      
      if (result.data.action === 'payment') {
        toast({ 
          title: 'Payment QR detected!',
          description: `Amount: ${formatCurrency(result.data.amount || 0)}`
        })
      }
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">QR Payments</h1>
          <p className="text-muted-foreground">
            Scan QR codes to pay or generate your own to receive payments
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scan" className="gap-2">
              <Scan className="h-4 w-4" />
              Scan & Pay
            </TabsTrigger>
            <TabsTrigger value="generate" className="gap-2">
              <QrCode className="h-4 w-4" />
              Receive
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-6">
            {isScanning ? (
              <Card>
                <CardContent className="p-6">
                  <div className="relative aspect-square max-w-sm mx-auto overflow-hidden rounded-lg bg-black">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-white/50 rounded-lg relative">
                        <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary" />
                        <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary" />
                        <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary" />
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary" />
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary animate-pulse" />
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-sm">
                      Point camera at QR code
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={stopScanning}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-4 flex justify-center gap-2">
                    <Button variant="outline" onClick={simulateScan}>
                      Simulate Scan
                    </Button>
                    <Button variant="outline" onClick={stopScanning}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : scannedData && scanResult ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    QR Code Scanned
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {scanResult.type === 'payment' && (
                    <div className="text-center p-6 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Payment Request</p>
                      <p className="text-4xl font-bold mb-4">
                        {formatCurrency(scanResult.amount || 0)}
                      </p>
                      {scanResult.description && (
                        <p className="text-muted-foreground">{scanResult.description}</p>
                      )}
                      {scanResult.recipient && (
                        <p className="text-sm text-muted-foreground mt-2">
                          To: {scanResult.recipient}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2">
                    {scanResult.action === 'payment' && (
                      <Button className="flex-1">
                        <Wallet className="mr-2 h-4 w-4" />
                        Pay Now
                      </Button>
                    )}
                    <Button variant="outline" className="flex-1" onClick={() => setScannedData(null)}>
                      Scan Another
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Scan className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Scan a QR Code</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                      Point your camera at a QR code to make a payment or view payment details
                    </p>
                    <Button size="lg" onClick={startScanning}>
                      <Camera className="mr-2 h-5 w-5" />
                      Start Scanning
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="generate" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Generate Payment QR</CardTitle>
                  <CardDescription>
                    Create a QR code for others to pay you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="qr-amount">Amount (optional)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="qr-amount"
                        type="number"
                        value={qrAmount}
                        onChange={(e) => setQrAmount(e.target.value)}
                        placeholder="Any amount"
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qr-desc">Description (optional)</Label>
                    <Input
                      id="qr-desc"
                      value={qrDescription}
                      onChange={(e) => setQrDescription(e.target.value)}
                      placeholder="What's this for?"
                    />
                  </div>
                  <Button 
                    className="w-full"
                    onClick={handleGenerateQR}
                    disabled={isGenerating}
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    Generate QR Code
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your QR Code</CardTitle>
                  <CardDescription>
                    {generatedQR ? 'Share this code to receive payments' : 'Generate a code to see it here'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {generatedQR ? (
                    <div className="text-center space-y-4">
                      <div className="inline-block p-4 bg-white rounded-lg">
                        <img src={generatedQR} alt="Payment QR Code" className="w-56 h-56" />
                      </div>
                      <canvas ref={canvasRef} className="hidden" />
                      {qrExpiry && (
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          Expires {formatDate(qrExpiry)}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={handleDownloadQR}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={handleShareQR}>
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-square flex flex-col items-center justify-center text-muted-foreground">
                      <QrCode className="h-16 w-16 mb-4 opacity-50" />
                      <p>QR code will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {qrHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Recent QR Codes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {qrHistory.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium">
                            {item.amount > 0 ? formatCurrency(item.amount) : 'Any amount'}
                          </p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {formatDate(item.createdAt)}
                          </p>
                          <Badge variant="secondary">
                            {new Date(item.expiresAt) > new Date() ? 'Active' : 'Expired'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
