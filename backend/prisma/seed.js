import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Pika database...')

  // ============================================
  // CLEANUP (for development)
  // ============================================
  // Uncomment to reset database
  // await prisma.notification.deleteMany()
  // await prisma.webhookLog.deleteMany()
  // await prisma.transaction.deleteMany()
  // await prisma.qrCode.deleteMany()
  // await prisma.paymentLink.deleteMany()
  // await prisma.wallet.deleteMany()
  // await prisma.session.deleteMany()
  // await prisma.account.deleteMany()
  // await prisma.user.deleteMany()

  // ============================================
  // USERS
  // ============================================
  console.log('Creating users...')

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pika.mx' },
    update: {},
    create: {
      email: 'admin@pika.mx',
      emailVerified: new Date(),
      name: 'Admin',
      role: 'ADMIN',
      isActive: true,
      isOnboarded: true,
    },
  })

  // Merchants
  const merchant1 = await prisma.user.upsert({
    where: { email: 'cafeteria@unam.mx' },
    update: {},
    create: {
      email: 'cafeteria@unam.mx',
      emailVerified: new Date(),
      name: 'Juan',
      businessName: 'Cafeteria UNAM',
      role: 'MERCHANT',
      rfc: 'CUPU800825569',
      businessType: 'INDIVIDUAL',
      industry: 'Food & Beverage',
      currency: 'MXN',
      language: 'es',
      timezone: 'America/Mexico_City',
      isActive: true,
      isOnboarded: true,
    },
  })

  const merchant2 = await prisma.user.upsert({
    where: { email: 'contacto@tienda-local.mx' },
    update: {},
    create: {
      email: 'contacto@tienda-local.mx',
      emailVerified: new Date(),
      name: 'María',
      businessName: 'Tienda Local',
      role: 'MERCHANT',
      rfc: 'TILM900101ABC',
      businessType: 'INDIVIDUAL',
      industry: 'Retail',
      currency: 'MXN',
      language: 'es',
      timezone: 'America/Mexico_City',
      isActive: true,
      isOnboarded: true,
    },
  })

  const merchant3 = await prisma.user.upsert({
    where: { email: 'ventas@techshop.mx' },
    update: {},
    create: {
      email: 'ventas@techshop.mx',
      emailVerified: new Date(),
      name: 'Carlos',
      businessName: 'TechShop Mexico',
      role: 'MERCHANT',
      rfc: 'TSHM850215XYZ',
      businessType: 'CORPORATION',
      industry: 'Electronics',
      currency: 'MXN',
      language: 'es',
      timezone: 'America/Mexico_City',
      isActive: true,
      isOnboarded: true,
    },
  })

  // Customer
  const customer1 = await prisma.user.upsert({
    where: { email: 'cliente@gmail.com' },
    update: {},
    create: {
      email: 'cliente@gmail.com',
      emailVerified: new Date(),
      name: 'Roberto',
      role: 'CUSTOMER',
      currency: 'MXN',
      language: 'es',
      timezone: 'America/Mexico_City',
      isActive: true,
      isOnboarded: true,
    },
  })

  // ============================================
  // WALLETS
  // ============================================
  console.log('Creating wallets...')

  const wallet1 = await prisma.wallet.upsert({
    where: { userId: merchant1.id },
    update: {},
    create: {
      userId: merchant1.id,
      balance: 150000, // $1,500.00 MXN in cents
      currency: 'MXN',
      dailyLimit: 100000, // $1,000 daily limit
      monthlyLimit: 2000000, // $20,000 monthly limit
      isActive: true,
    },
  })

  const wallet2 = await prisma.wallet.upsert({
    where: { userId: merchant2.id },
    update: {},
    create: {
      userId: merchant2.id,
      balance: 85000, // $850.00 MXN
      currency: 'MXN',
      dailyLimit: 50000, // $500 daily limit
      monthlyLimit: 1000000, // $10,000 monthly limit
      isActive: true,
    },
  })

  const wallet3 = await prisma.wallet.upsert({
    where: { userId: merchant3.id },
    update: {},
    create: {
      userId: merchant3.id,
      balance: 250000, // $2,500.00 MXN
      currency: 'MXN',
      dailyLimit: 200000, // $2,000 daily limit
      monthlyLimit: 5000000, // $50,000 monthly limit
      isActive: true,
    },
  })

  const walletCustomer = await prisma.wallet.upsert({
    where: { userId: customer1.id },
    update: {},
    create: {
      userId: customer1.id,
      balance: 5000, // $50.00 MXN
      currency: 'MXN',
      isActive: true,
    },
  })

  // ============================================
  // PAYMENT LINKS
  // ============================================
  console.log('Creating payment links...')

  const link1 = await prisma.paymentLink.create({
    data: {
      userId: merchant1.id,
      title: 'Cafeteria Menu - Daily Specials',
      description: 'Pay for your meal at UNAM Cafeteria',
      amount: 15000, // $150.00 MXN
      currency: 'MXN',
      type: 'ONE_TIME',
      collectName: true,
      collectEmail: false,
      collectPhone: false,
      logo: 'https://example.com/logo.png',
      themeColor: '#E53935',
      customMessage: 'Gracias por su compra',
      successUrl: 'https://cafeteria-unam.mx/success',
      cancelUrl: 'https://cafeteria-unam.mx/cancel',
      shortCode: 'cafe1',
      slug: 'cafeteria-unam',
      isActive: true,
    },
  })

  const link2 = await prisma.paymentLink.create({
    data: {
      userId: merchant2.id,
      title: 'Tienda Local - Pago de Productos',
      description: 'Pay for your purchase at Tienda Local',
      amount: 0, // Flexible amount
      currency: 'MXN',
      type: 'ONE_TIME',
      collectName: true,
      collectEmail: true,
      collectPhone: true,
      themeColor: '#1976D2',
      customMessage: '¡Gracias por comprar local!',
      shortCode: 'tienda',
      slug: 'tienda-local',
      isActive: true,
      maxUses: 100,
      usedCount: 23,
    },
  })

  const link3 = await prisma.paymentLink.create({
    data: {
      userId: merchant3.id,
      title: 'TechShop - Electronic Products',
      description: 'Pay for your electronics purchase',
      amount: 0, // Flexible amount
      currency: 'MXN',
      type: 'INVOICE',
      collectName: true,
      collectEmail: true,
      collectPhone: true,
      collectAddress: true,
      logo: 'https://techshop.mx/logo.png',
      themeColor: '#388E3C',
      customMessage: 'TechShop - Your trusted electronics store',
      successUrl: 'https://techshop.mx/order-confirmation',
      cancelUrl: 'https://techshop.mx/checkout',
      shortCode: 'techshop',
      slug: 'techshop-mx',
      requireAuth: true,
      isActive: true,
    },
  })

  const link4 = await prisma.paymentLink.create({
    data: {
      userId: merchant1.id,
      title: 'Catering Services - Deposit',
      description: 'Pay deposit for catering services',
      amount: 50000, // $500.00 MXN
      currency: 'MXN',
      type: 'ONE_TIME',
      collectName: true,
      collectEmail: true,
      collectPhone: true,
      themeColor: '#E53935',
      customMessage: 'Deposit for catering services',
      shortCode: 'catering',
      slug: 'cafeteria-catering',
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  })

  // ============================================
  // QR CODES
  // ============================================
  console.log('Creating QR codes...')

  const qr1 = await prisma.qrCode.create({
    data: {
      userId: merchant1.id,
      name: 'Cafeteria Counter QR',
      description: 'QR code at cafeteria counter for quick payments',
      amount: 0, // Flexible amount
      currency: 'MXN',
      type: 'DYNAMIC',
      data: 'https://pika.mx/pay/qr/cafeteria-counter',
      format: 'PNG',
      size: 300,
      color: '#000000',
      backgroundColor: '#FFFFFF',
      location: 'UNAM Cafeteria - Main Counter',
      deviceId: 'terminal-001',
      targetUrl: 'https://pika.mx/pay/qr/cafeteria-counter',
      isActive: true,
      scanCount: 156,
      lastScannedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    },
  })

  const qr2 = await prisma.qrCode.create({
    data: {
      userId: merchant2.id,
      name: 'Store Entrance QR',
      description: 'QR code at store entrance for payments',
      amount: 0,
      currency: 'MXN',
      type: 'DYNAMIC',
      data: 'https://pika.mx/pay/qr/tienda-entrada',
      format: 'PNG',
      size: 400,
      color: '#1976D2',
      backgroundColor: '#FFFFFF',
      logo: 'https://tienda-local.mx/logo.png',
      location: 'Tienda Local - Main Entrance',
      deviceId: 'terminal-002',
      targetUrl: 'https://pika.mx/pay/qr/tienda-entrada',
      isActive: true,
      scanCount: 342,
      lastScannedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    },
  })

  const qr3 = await prisma.qrCode.create({
    data: {
      userId: merchant3.id,
      name: 'TechShop Cashier QR',
      description: 'QR code at cashier for electronic product payments',
      amount: 0,
      currency: 'MXN',
      type: 'PAYMENT_REQUEST',
      data: 'https://pika.mx/pay/qr/techshop-cashier',
      format: 'PNG',
      size: 350,
      color: '#388E3C',
      backgroundColor: '#FFFFFF',
      logo: 'https://techshop.mx/logo.png',
      location: 'TechShop - Cashier 1',
      deviceId: 'terminal-003',
      targetUrl: 'https://pika.mx/pay/qr/techshop-cashier',
      isActive: true,
      scanCount: 527,
      lastScannedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    },
  })

  const qr4 = await prisma.qrCode.create({
    data: {
      userId: merchant1.id,
      name: 'Coffee Vending Machine',
      description: 'QR code for coffee vending machine payment',
      amount: 2500, // Fixed $25.00 MXN
      currency: 'MXN',
      type: 'STATIC',
      data: 'pika://pay/qr/coffee-vending-001',
      format: 'PNG',
      size: 250,
      color: '#795548',
      backgroundColor: '#FFFFFF',
      location: 'Building C - Coffee Vending Machine',
      deviceId: 'vending-001',
      isActive: true,
      scanCount: 89,
      lastScannedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
  })

  // ============================================
  // TRANSACTIONS
  // ============================================
  console.log('Creating transactions...')

  // Completed payments
  await prisma.transaction.createMany({
    data: [
      // SPEI payments
      {
        userId: merchant1.id,
        walletId: wallet1.id,
        type: 'DEPOSIT',
        status: 'COMPLETED',
        amount: 15000, // $150.00
        fee: 525, // 3.5% fee = $5.25
        netAmount: 14475,
        currency: 'MXN',
        description: 'Cafeteria order payment',
        paymentMethod: 'SPEI',
        provider: 'STP',
        providerTxId: 'STP' + Date.now() + '001',
        processorFee: 525,
        processorFeePercent: 3.5,
        completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        userId: merchant2.id,
        walletId: wallet2.id,
        type: 'DEPOSIT',
        status: 'COMPLETED',
        amount: 8500, // $85.00
        fee: 298, // 3.5% fee
        netAmount: 8202,
        currency: 'MXN',
        description: 'Grocery payment',
        paymentMethod: 'SPEI',
        provider: 'STP',
        providerTxId: 'STP' + Date.now() + '002',
        processorFee: 298,
        processorFeePercent: 3.5,
        completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
      // Card payments
      {
        userId: merchant3.id,
        walletId: wallet3.id,
        type: 'DEPOSIT',
        status: 'COMPLETED',
        amount: 45000, // $450.00
        fee: 1688, // ~3.75% card fee
        netAmount: 43312,
        currency: 'MXN',
        description: 'Laptop purchase',
        paymentMethod: 'CARD',
        provider: 'STRIPE',
        providerTxId: 'pi_' + Math.random().toString(36).substring(7),
        providerUrl: 'https://dashboard.stripe.com/payments/pi_test',
        processorFee: 1688,
        processorFeePercent: 3.75,
        completedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
      {
        userId: merchant1.id,
        walletId: wallet1.id,
        type: 'DEPOSIT',
        status: 'COMPLETED',
        amount: 35000, // $350.00
        fee: 1225, // 3.5% fee
        netAmount: 33775,
        currency: 'MXN',
        description: 'Catering service deposit',
        paymentMethod: 'CARD',
        provider: 'MERCADO_PAGO',
        providerTxId: 'MP' + Date.now() + '001',
        processorFee: 1225,
        processorFeePercent: 3.5,
        completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        qrCodeId: qr1.id,
      },
      // OXXO payments
      {
        userId: merchant2.id,
        walletId: wallet2.id,
        type: 'DEPOSIT',
        status: 'COMPLETED',
        amount: 5000, // $50.00
        fee: 400, // Higher fee for OXXO (8%)
        netAmount: 4600,
        currency: 'MXN',
        description: 'Store purchase - OXXO payment',
        paymentMethod: 'CASH',
        provider: 'MERCADO_PAGO',
        providerTxId: 'MP' + Date.now() + '002',
        processorFee: 400,
        processorFeePercent: 8.0,
        completedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      },
      // Pending transactions
      {
        userId: merchant3.id,
        walletId: wallet3.id,
        type: 'DEPOSIT',
        status: 'PENDING',
        amount: 12000, // $120.00
        fee: 0,
        netAmount: 12000,
        currency: 'MXN',
        description: 'Phone accessory purchase',
        paymentMethod: 'SPEI',
        provider: 'STP',
        metadata: {
          customerName: 'Roberto Garcia',
          customerEmail: 'roberto@gmail.com',
          items: [
            { name: 'Phone Case', price: 30000 },
            { name: 'Screen Protector', price: 9000 },
          ],
        },
        qrCodeId: qr3.id,
      },
      // Failed transaction
      {
        userId: merchant2.id,
        walletId: wallet2.id,
        type: 'PAYMENT',
        status: 'FAILED',
        amount: 15000, // $150.00
        fee: 0,
        netAmount: 15000,
        currency: 'MXN',
        description: 'Failed payment attempt',
        paymentMethod: 'CARD',
        provider: 'STRIPE',
        providerTxId: 'pi_failed_' + Math.random().toString(36).substring(7),
        failedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        metadata: {
          failureReason: 'Insufficient funds',
        },
      },
      // Withdrawal
      {
        userId: merchant1.id,
        walletId: wallet1.id,
        type: 'WITHDRAWAL',
        status: 'COMPLETED',
        amount: 50000, // $500.00
        fee: 500, // 1% withdrawal fee
        netAmount: 49500,
        currency: 'MXN',
        description: 'Bank transfer withdrawal',
        paymentMethod: 'SPEI',
        provider: 'STP',
        providerTxId: 'STP_WITHDRAW_' + Date.now(),
        processorFee: 500,
        processorFeePercent: 1.0,
        completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      // Refund
      {
        userId: merchant3.id,
        walletId: wallet3.id,
        type: 'REFUND',
        status: 'COMPLETED',
        amount: -45000, // Negative for refund
        fee: 0,
        netAmount: -45000,
        currency: 'MXN',
        description: 'Refund for laptop return',
        paymentMethod: 'CARD',
        provider: 'STRIPE',
        providerTxId: 'pi_refund_' + Math.random().toString(36).substring(7),
        originalTxId: 'original_payment_id',
        refundReason: 'Product returned - defective',
        refundedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
  })

  // ============================================
  // NOTIFICATIONS
  // ============================================
  console.log('Creating notifications...')

  await prisma.notification.createMany({
    data: [
      {
        userId: merchant1.id,
        type: 'PAYMENT_RECEIVED',
        title: '¡Pago recibido!',
        message: 'Has recibido un pago de $150.00 MXN vía SPEI',
        actionUrl: '/transactions',
        actionLabel: 'Ver detalles',
      },
      {
        userId: merchant1.id,
        type: 'WITHDRAWAL_COMPLETE',
        title: 'Retiro completado',
        message: 'Tu retiro de $500.00 MXN ha sido procesado exitosamente',
        actionUrl: '/wallet',
        actionLabel: 'Ver wallet',
      },
      {
        userId: merchant2.id,
        type: 'QR_SCANNED',
        title: 'Código QR escaneado',
        message: 'Tu código QR de la tienda ha sido escaneado 5 veces hoy',
        actionUrl: '/qr-codes',
        actionLabel: 'Ver estadísticas',
      },
      {
        userId: merchant3.id,
        type: 'PAYMENT_FAILED',
        title: 'Pago fallido',
        message: 'Un pago de $120.00 está pendiente de confirmación',
        actionUrl: '/transactions',
        actionLabel: 'Ver transacción',
      },
      {
        userId: merchant3.id,
        type: 'REFUND_ISSUED',
        title: 'Reembolso procesado',
        message: 'Se ha procesado un reembolso de $450.00 MXN',
        actionUrl: '/transactions',
        actionLabel: 'Ver detalles',
      },
      {
        userId: merchant2.id,
        type: 'MONTHLY_SUMMARY',
        title: 'Resumen mensual',
        message: 'En el último mes recibiste $25,000.00 MXN en 45 transacciones',
        actionUrl: '/analytics',
        actionLabel: 'Ver reporte',
      },
    ],
  })

  // ============================================
  // WEBHOOK LOGS
  // ============================================
  console.log('Creating webhook logs...')

  await prisma.webhookLog.createMany({
    data: [
      {
        event: 'payment_intent.succeeded',
        provider: 'STRIPE',
        payload: {
          id: 'pi_test_123',
          amount: 45000,
          currency: 'mxn',
          status: 'succeeded',
        },
        processed: true,
        httpStatus: 200,
        processedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
      {
        event: 'charge.failed',
        provider: 'STRIPE',
        payload: {
          id: 'ch_failed_456',
          amount: 15000,
          currency: 'mxn',
          failure_code: 'insufficient_funds',
        },
        processed: true,
        httpStatus: 200,
        processedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        event: 'payment.created',
        provider: 'MERCADO_PAGO',
        payload: {
          id: 'MP123456',
          amount: 5000,
          currency: 'mxn',
          payment_method: 'oxxo',
        },
        processed: true,
        httpStatus: 200,
        processedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      },
      {
        event: 'transaction.created',
        provider: 'SPEI',
        payload: {
          id: 'STP789',
          amount: 15000,
          rfc_curp_beneficiario: 'CUPU800825569',
          tipo_cuenta: '40',
        },
        processed: false,
        error: 'Processing timeout',
      },
    ],
  })

  console.log('✅ Seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`- Users: 4 (1 admin, 3 merchants, 1 customer)`)
  console.log(`- Wallets: 4`)
  console.log(`- Payment Links: 4`)
  console.log(`- QR Codes: 4`)
  console.log(`- Transactions: 9 (including refunds, withdrawals)`)
  console.log(`- Notifications: 6`)
  console.log(`- Webhook Logs: 4`)
  console.log('\n💰 Total balances:')
  console.log(`- Cafeteria UNAM: $${wallet1.balance / 100} MXN`)
  console.log(`- Tienda Local: $${wallet2.balance / 100} MXN`)
  console.log(`- TechShop: $${wallet3.balance / 100} MXN`)
  console.log(`- Customer: $${walletCustomer.balance / 100} MXN`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
