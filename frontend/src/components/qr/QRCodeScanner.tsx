import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Scan, Camera, X } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export function QRCodeScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const [scannedData, setScannedData] = useState<string | null>(null)
  const { toast } = useToast()

  const startScanning = () => {
    setIsScanning(true)
    setScannedData(null)
    toast({
      title: 'Camera started',
      description: 'Point your camera at a QR code to scan.'
    })
  }

  const stopScanning = () => {
    setIsScanning(false)
  }

  const handleScan = (data: string | null) => {
    if (data) {
      setScannedData(data)
      setIsScanning(false)
      toast({
        title: 'QR Code Scanned!',
        description: `Found: ${data.substring(0, 50)}...`
      })
    }
  }

  const handleProcessData = () => {
    if (scannedData) {
      // Check if it's a payment link
      if (scannedData.includes('pika.pay') || scannedData.startsWith('https://')) {
        toast({
          title: 'Payment link detected',
          description: 'Opening payment details...'
        })
        // In a real app, this would navigate to the payment screen
      } else {
        toast({
          title: 'Data scanned',
          description: scannedData
        })
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          QR Code Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="scan" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scan">Scan</TabsTrigger>
            <TabsTrigger value="result">Result</TabsTrigger>
          </TabsList>
          
          <TabsContent value="scan" className="space-y-4">
            {isScanning ? (
              <div className="relative aspect-square max-w-sm mx-auto overflow-hidden rounded-lg border bg-black">
                {/* Mock camera view - in real app, use react-qr-scanner */}
                <div className="absolute inset-0 flex items-center justify-center text-white/50">
                  <div className="text-center">
                    <Camera className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">Camera Active</p>
                    <p className="text-xs mt-1">Scanning for QR codes...</p>
                  </div>
                </div>
                
                {/* Simulated scan frame */}
                <div className="absolute inset-4 border-2 border-white/50 rounded-lg">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary" />
                </div>
                
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={stopScanning}
                >
                  <X className="h-4 w-4" />
                </Button>
                
                {/* Mock scan button for demo */}
                <Button
                  variant="secondary"
                  className="absolute bottom-4 left-1/2 -translate-x-1/2"
                  onClick={() => handleScan('https://pika.pay/link/demo123')}
                >
                  Simulate Scan
                </Button>
              </div>
            ) : (
              <div className="aspect-square max-w-sm mx-auto flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8">
                <Scan className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center mb-4">
                  Scan QR codes to make payments or view details
                </p>
                <Button onClick={startScanning}>
                  <Camera className="mr-2 h-4 w-4" />
                  Start Scanning
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="result" className="space-y-4">
            {scannedData ? (
              <div className="p-4 border rounded-lg space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Scanned Data</p>
                  <p className="font-mono text-sm break-all bg-muted p-2 rounded mt-1">
                    {scannedData}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleProcessData} className="flex-1">
                    Process Payment
                  </Button>
                  <Button variant="outline" onClick={() => setScannedData(null)}>
                    Clear
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Scan className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No QR code scanned yet</p>
                <p className="text-sm">Scan a code to see results here</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}