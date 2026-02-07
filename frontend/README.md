# Pika Frontend

A modern payment application built with Vite, React, TypeScript, and shadcn/ui.

## Features

- **Wallet/Balance Display**: View your account balance with a beautiful gradient card
- **Transaction History**: Track all your payments with filtering by type (sent, received, pending)
- **Send Money Flow**: Quick send interface with contact selection and amount input
- **Request Money Flow**: Send payment requests to anyone via email or phone
- **Payment Link Creation**: Generate shareable payment links with custom amounts and expiration
- **QR Code Scanner**: Scan payment QR codes (mock implementation)
- **QR Code Generator**: Create and download QR codes for payment links

## Tech Stack

- **Build Tool**: Vite 6
- **Framework**: React 18 with TypeScript
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS with custom CSS variables
- **Icons**: Lucide React
- **QR Codes**: qrcode library

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components (Button, Card, Dialog, etc.)
│   ├── wallet/          # Wallet balance component
│   ├── transactions/    # Transaction list component
│   ├── payment/         # Payment dialogs (Send, Request, Link)
│   ├── qr/             # QR code scanner and generator
│   ├── pages/          # Page views (Wallet, Transactions, Send, QR)
│   └── layout/         # Navigation component
├── lib/
│   ├── utils.ts        # Utility functions (cn helper)
│   └── mock-data.ts    # Mock data for development
├── types/
│   └── index.ts        # TypeScript type definitions
├── App.tsx             # Main app component
└── main.tsx            # Entry point
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open http://localhost:3000 in your browser

### Build for Production

```bash
npm run build
```

## Usage

### Navigation

The app features a responsive bottom navigation bar on mobile and a top navigation bar on desktop with four main sections:

- **Wallet**: Overview of balance, quick actions, and recent transactions
- **History**: Full transaction history with filtering options
- **Send**: Quick send interface with contacts and quick amounts
- **QR Code**: Scan or generate QR codes for payments

### Payment Flows

1. **Send Money**: Click "Send Money" → Select recipient → Enter amount → Confirm
2. **Request Money**: Click "Request Money" → Enter requestor info → Enter amount → Send request
3. **Create Payment Link**: Click "Create Payment Link" → Set amount → Generate link → Share

### QR Code Features

- **Scanner**: Click "Start Scanning" to activate camera (mock implementation)
- **Generator**: Enter text/URL → Click Generate → Download QR code image

## Design System

The app uses a purple primary color scheme with:
- Primary: hsl(262, 83%, 58%)
- Light/dark mode support via CSS variables
- shadcn/ui component patterns
- Consistent spacing and typography

## Mock Data

The app includes mock data for development:
- Wallet balance: $15,250.00
- 5 sample transactions
- 5 sample contacts
- Sample payment links
