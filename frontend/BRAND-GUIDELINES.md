# Pika Brand Guidelines

## Brand Identity

**Pika** represents lightning-fast, secure, and modern payment infrastructure. Our brand combines the energy of a lightning bolt with the trust of financial technology.

### Brand Attributes

- **Fast** - Lightning-quick transactions, instant feedback
- **Secure** - Trustworthy, reliable, professional
- **Modern** - Clean, innovative, forward-thinking
- **Friendly** - Approachable, simple, human-centered

---

## Logo Usage

### Primary Logo

Use `PikaLogoFull` for:
- Landing pages
- Marketing materials
- Splash screens
- Branded documents
- Presentations

```tsx
import { PikaLogoFull } from '@/components/ui/brand-logos'

<PikaLogoFull size={200} />
```

### App Icon

Use `PikaIcon` for:
- App icons
- Favicons
- Small logos (under 100px)
- Navigation bars
- Touch targets

```tsx
import { PikaIcon } from '@/components/ui/brand-logos'

<PikaIcon size={64} />
```

### Wordmark

Use `PikaWordmark` for:
- Headers
- Navigation
- Document titles
- Email signatures

```tsx
import { PikaWordmark } from '@/components/ui/brand-logos'

<PikaWordmark width={200} height={48} />
```

### Symbol

Use `PikaSymbol` for:
- Loading states
- Success indicators
- Small decorative elements
- Feature icons

```tsx
import { PikaSymbol } from '@/components/ui/brand-logos'

<PikaSymbol size={32} />
```

### Logo Clear Space

Maintain clear space around the logo equal to the height of the "PIKA" text.

### Minimum Sizes

| Logo Type | Minimum Size |
|-----------|--------------|
| Full Logo | 120px width |
| Icon | 32px × 32px |
| Wordmark | 100px width |
| Symbol | 16px × 16px |

---

## Color System

### Primary Brand Color

**Electric Violet** - `hsl(263, 85%, 60%)` - `#8B5CF6`

Usage:
- Primary buttons
- Links
- Active states
- Brand accents
- Logo gradients

### Secondary Brand Color

**Trust Blue** - `hsl(220, 85%, 55%)` - `#3B82F6`

Usage:
- Secondary buttons
- Trust indicators
- Security badges
- Gradient accents

### Accent Colors

| Color | HSL | Usage |
|-------|-----|-------|
| Success | `150, 65%, 45%` | Completed payments, positive states |
| Warning | `45, 93%, 47%` | Pending transactions, alerts |
| Danger | `0, 72%, 51%` | Failed payments, errors |
| Accent | `263, 85%, 95%` | Hover states, subtle backgrounds |

### Gradient Usage

The signature Pika gradient goes from Electric Violet to Trust Blue:

```css
background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%);
```

Use for:
- Logo backgrounds
- Hero sections
- CTA buttons
- Card highlights
- Payment cards

---

## Typography

### Font Family

**Inter** - Our primary typeface

```css
font-family: 'Inter', system-ui, sans-serif;
```

### Type Hierarchy

| Element | Weight | Size | Usage |
|---------|--------|------|-------|
| Display XL | 800 | 4.5rem | Hero titles |
| Display LG | 800 | 3.75rem | Large headlines |
| Display MD | 800 | 3rem | Page titles |
| H1 | 700 | 3rem | Main page title |
| H2 | 700 | 1.875rem | Section title |
| H3 | 600 | 1.5rem | Subsection |
| H4 | 600 | 1.25rem | Card title |
| Body | 400 | 1rem | Body text |
| Small | 400 | 0.875rem | Captions |

### Tabular Numbers

**Always use tabular numbers for monetary amounts:**

```tsx
<p className="font-mono-number">$1,234.56</p>
```

### Text Colors

- **Primary text:** `text-foreground` (near black)
- **Secondary text:** `text-muted-foreground` (gray)
- **Brand text:** `text-brand-electric` (electric violet)
- **Gradient text:** `text-gradient` (gradient utility)

---

## Iconography

### Icon System

We use **Lucide React** for consistency.

```bash
npm install lucide-react
```

### Key Brand Icons

| Icon | Name | Usage |
|------|------|-------|
| ⚡ | Zap | Speed, instant actions, brand symbol |
| ✓ | CheckCircle | Success, completed |
| ⏱ | Clock | Pending, time |
| ✕ | XCircle | Error, failed |
| ↑ | ArrowUpRight | Send, outgoing |
| ↓ | ArrowDownLeft | Receive, incoming |
| 💳 | CreditCard | Payments, cards |
| 👛 | Wallet | Wallet balance |
| 🛡 | Shield | Security, trust |

### Icon Sizes

| Size | Class | Dimensions | Usage |
|------|-------|-------------|-------|
| XS | w-3 h-3 | 12px | Inline icons |
| SM | w-4 h-4 | 16px | Button icons |
| MD | w-5 h-5 | 20px | Default icons |
| LG | w-6 h-6 | 24px | Large icons |
| XL | w-8 h-8 | 32px | Feature icons |
| 2XL | w-12 h-12 | 48px | Hero icons |

---

## Layout Patterns

### Spacing Scale

Based on 4px grid:

| Token | Value | Usage |
|-------|-------|-------|
| gap-1 | 4px | Tight spacing |
| gap-2 | 8px | Default spacing |
| gap-3 | 12px | Comfortable spacing |
| gap-4 | 16px | Section spacing |
| gap-6 | 24px | Component spacing |
| gap-8 | 32px | Large sections |

### Container Width

Max content width: `1280px` (7xl)

```tsx
<div className="container-pika">
  {/* Content */}
</div>
```

### Card Radius

| Size | Value | Usage |
|------|-------|-------|
| brand-sm | 8px | Small elements |
| brand-md | 12px | Buttons, inputs |
| brand-lg | 16px | Cards |
| brand-xl | 24px | Hero sections |

---

## Component Patterns

### Buttons

```tsx
// Primary
<button className="btn-primary">
  <Zap className="w-4 h-4" />
  Send Payment
</button>

// Secondary
<button className="btn-secondary">
  Cancel
</button>

// Ghost
<button className="btn-ghost">
  Learn More
</button>
```

### Cards

```tsx
// Basic card
<div className="card-pika">
  {/* Content */}
</div>

// Interactive card
<div className="card-pika-hover">
  {/* Hover effects */}
</div>
```

### Badges

```tsx
<Badge className="badge-success">Complete</Badge>
<Badge className="badge-warning">Pending</Badge>
<Badge className="badge-brand">Instant</Badge>
```

---

## Animation Principles

### Duration

- **Micro-interactions:** 150ms (hover, focus)
- **UI transitions:** 200ms (modals, dropdowns)
- **Page transitions:** 300ms
- **Complex animations:** 400ms

### Easing

- **Default:** `ease-out` (most animations)
- **Entry:** `ease-out` (natural feel)
- **Exit:** `ease-in` (quick departure)
- **Bounce:** `cubic-bezier(0.68, -0.55, 0.265, 1.55)` (success states)

### Payment Animations

```tsx
// Success - Bounce effect
<PaymentSuccess />

// Fly in - New payment
<FlyingPayment direction="in">

// Fly out - Sent payment
<FlyingPayment direction="out">

// Processing
<PaymentProcessing progress={0.6} />
```

---

## Voice and Tone

### Brand Voice

- **Clear** - Simple, direct language
- **Confident** - Professional but approachable
- **Efficient** - Concise, to the point
- **Friendly** - Warm, human-centered

### Writing Style

✅ **Do:**
- Use active voice ("Send payment" not "Payment can be sent")
- Be specific ("$25.00 sent to Sarah" not "Transaction complete")
- Show progress ("Sending..." "Sent!" not static states)
- Use contractions ("You'll" not "You will")

❌ **Don't:**
- Use jargon ("Execute transaction" not "Send money")
- Be vague ("Done" not "Payment sent")
- Use passive voice
- Over-explain

### Microcopy Examples

| Context | Copy |
|---------|------|
| Send button | "Send Instantly" |
| Success | "Payment sent!" |
| Error | "Something went wrong" |
| Loading | "Sending payment..." |
| Empty state | "No payments yet" |
| Retry | "Try again" |

---

## Photography

### Style

- Clean, modern backgrounds
- People using mobile devices
- Bright, natural lighting
- Diverse subjects
- Authentic moments

### Usage

- Product screenshots
- Team photos
- Customer stories
- Lifestyle imagery
- Background graphics

---

## Do's and Don'ts

### ✅ Do

- Use the logo on clean backgrounds
- Maintain clear space around logos
- Use tabular numbers for amounts
- Provide instant feedback for actions
- Test at 200% zoom for accessibility
- Use semantic color names
- Maintain consistent spacing
- Show payment status clearly

### ❌ Don't

- Stretch or skew the logo
- Use the logo on busy backgrounds
- Use red/green without text labels
- Animate important text
- Mix multiple animation types
- Use color alone to convey meaning
- Skip hover states on desktop
- Forget loading states

---

## File Organization

```
src/
├── assets/
│   ├── pika-logo.svg       # Full logo
│   ├── pika-icon.svg       # App icon
│   └── pika-wordmark.svg   # Text logo
├── components/
│   └── ui/
│       ├── brand-logos.tsx        # Logo components
│       ├── payment-animations.tsx # Animation components
│       └── payment-cards.tsx      # Card components
├── styles/
│   └── index.css            # Design system
├── DESIGN-SYSTEM.md         # Full design documentation
├── CSS-REFERENCE.md         # CSS class reference
└── BRAND-GUIDELINES.md      # This file
```

---

## Resources

### Design Files

- Logo SVGs: `/src/assets/`
- Components: `/src/components/ui/`
- Styles: `/src/index.css`

### Documentation

- **Design System:** `DESIGN-SYSTEM.md` - Complete design tokens and patterns
- **CSS Reference:** `CSS-REFERENCE.md` - All CSS classes and utilities
- **Brand Guidelines:** `BRAND-GUIDELINES.md` - This file

### External Resources

- [Inter Font](https://rsms.me/inter/)
- [Lucide Icons](https://lucide.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## Version History

**v1.0.0** (2025-02-05)
- Initial brand system
- Color palette
- Typography system
- Logo family
- Animation patterns
- Component library

---

**Questions?** Refer to `DESIGN-SYSTEM.md` for technical details or `CSS-REFERENCE.md` for implementation.
