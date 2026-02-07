# PIKA Design System

## Brand Philosophy

**Pika** = Lightning-fast payments + Electric energy

Our design system embodies three core fintech principles:
- **Trust** - Professional blues, secure interfaces, clear hierarchy
- **Speed** - Electric violet accents, swift animations, instant feedback
- **Modernity** - Clean typography, generous whitespace, subtle gradients

---

## Color Palette

### Primary Colors

| Color | Usage | HSL Value |
|-------|-------|-----------|
| **Electric Violet** | Primary actions, brand | `263 85% 60%` |
| **Trust Blue** | Secondary actions, trust indicators | `220 85% 55%` |
| **Success Green** | Completed payments, positive states | `150 65% 45%` |
| **Warning Amber** | Pending transactions, warnings | `45 93% 47%` |
| **Danger Red** | Failed payments, errors | `0 72% 51%` |

### Payment States

| State | Color | Usage |
|-------|-------|-------|
| **Incoming** | `150 65% 45%` | Money received |
| **Outgoing** | `240 60% 55%` | Money sent |
| **Pending** | `45 93% 47%` | Processing |

### Semantic Tokens

```css
/* Brand Colors */
--brand-electric: 263 85% 60%;   /* Main brand */
--brand-trust: 220 85% 55%;      /* Trust indicators */
--brand-success: 150 65% 45%;    /* Success states */
--brand-warning: 45 93% 47%;     /* Warnings */
--brand-danger: 0 72% 51%;       /* Errors */

/* Payment States */
--payment-incoming: 150 65% 45%;
--payment-outgoing: 240 60% 55%;
--payment-pending: 45 93% 47%;
```

---

## Typography

### Font Families

```css
font-family: 'Inter', system-ui, sans-serif;  /* Body */
font-family: 'Inter', system-ui, sans-serif;  /* Display (bold weight) */
font-family: 'JetBrains Mono', monospace;     /* Numbers, codes */
```

### Type Scale

| Style | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| Display XL | 4.5rem | 800 | 1.0 | -0.04em | Hero titles |
| Display LG | 3.75rem | 800 | 1.0 | -0.04em | Large headlines |
| Display MD | 3rem | 800 | 1.1 | -0.03em | Page titles |
| Display SM | 2.5rem | 800 | 1.1 | -0.03em | Section headers |
| Display XS | 2rem | 800 | 1.2 | -0.02em | Large subheadings |
| H1 | 3rem | 700 | 1.1 | -0.03em | Main page title |
| H2 | 1.875rem | 700 | 1.2 | -0.02em | Section title |
| H3 | 1.5rem | 600 | 1.3 | -0.01em | Subsection |
| H4 | 1.25rem | 600 | 1.4 | normal | Card title |
| Body | 1rem | 400 | 1.6 | normal | Body text |
| Small | 0.875rem | 400 | 1.5 | normal | Captions |

### Typography Best Practices

- **Use tabular numbers** (`font-mono-number`) for all monetary amounts
- **Limit line length** to 60-80 characters for readability
- **Use font weight** to create hierarchy, not just size
- **Respect letter-spacing** - tight for large text, normal for body

---

## Layout Patterns

### Container System

```tsx
<div className="container-pika">
  {/* Content - max-width 1280px, centered with padding */}
</div>
```

### Card System

```tsx
{/* Basic Card */}
<div className="card-pika">
  {/* Card content */}
</div>

{/* Interactive Card */}
<div className="card-pika-hover">
  {/* Hover effects: elevation + lift */}
</div>
```

### Input Fields

```tsx
<input className="input-pika" />
{/* - Height: 44px (touch-friendly)
    - Rounded: 12px
    - Focus ring: 2px primary
    - Smooth transitions */}
```

### Button System

```tsx
{/* Primary - Main actions */}
<button className="btn-primary">
  Send Payment
</button>

{/* Secondary - Alternative actions */}
<button className="btn-secondary">
  Cancel
</button>

{/* Ghost - Tertiary actions */}
<button className="btn-ghost">
  Learn More
</button>
```

**Button anatomy:**
- Height: 42px
- Padding: 0.75rem × 1rem
- Border radius: 12px
- Icon gap: 0.5rem
- Active scale: 0.95 (tactile feedback)

---

## Micro-interactions

### Payment Animations

```tsx
{/* Success - Bounce effect */}
<div className="payment-success">
  <CheckCircle />
</div>

{/* Incoming - Fly in from right */}
<div className="payment-fly-in">
  {/* New payment notification */}
</div>

{/* Outgoing - Fly out to left */}
<div className="payment-fly-out">
  {/* Sent payment */}
</div>
```

### Loading States

```tsx
{/* Skeleton loading */}
<div className="skeleton h-12 w-full" />
<div className="skeleton-text" />
<div className="skeleton-circle h-12 w-12" />

{/* Shimmer effect */}
<div className="shimmer" />
{/* Background gradient that animates across */}
```

### Hover Effects

```tsx
{/* Lift on hover */}
<div className="hover-lift">
  {/* Elevates by 4px */}
</div>

{/* Glow on hover */}
<div className="hover-glow">
  {/* Adds colored shadow */}
</div>
```

### Focus States

```tsx
<button className="focus-ring">
  {/* 2px ring with offset */}
</button>
```

### Ripple Effect

```tsx
<button className="ripple">
  {/* Material-inspired ripple on click */}
</button>
```

---

## Spacing System

Based on 4px base unit:

| Token | Value | Usage |
|-------|-------|-------|
| `gap-1` | 4px | Tight spacing |
| `gap-2` | 8px | Default spacing |
| `gap-3` | 12px | Comfortable spacing |
| `gap-4` | 16px | Section spacing |
| `gap-6` | 24px | Component spacing |
| `gap-8` | 32px | Large sections |
| `gap-12` | 48px | Page sections |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `brand-sm` | 8px | Small elements, badges |
| `brand-md` | 12px | Buttons, inputs |
| `brand-lg` | 16px | Cards, modals |
| `brand-xl` | 24px | Hero sections, panels |

---

## Shadows

| Token | Usage |
|-------|-------|
| `brand-sm` | Subtle elevation |
| `brand-md` | Cards, buttons |
| `brand-lg` | Dropdowns, popovers |
| `brand-xl` | Modals, overlays |
| `glow-sm/md/lg` | Primary color glow effects |

---

## Icons

We use **Lucide React** for consistency.

```tsx
import {
  Zap,          // Speed, instant
  ArrowRight,   // Send, transfer
  ArrowLeft,    // Receive
  CheckCircle,  // Success
  AlertCircle,  // Warning
  XCircle,      // Error
  CreditCard,   // Payments
  Wallet,       // Wallet
  Clock,        // Pending
  Shield,       // Security
} from 'lucide-react';
```

### Icon Sizes

| Size | Class | Usage |
|------|-------|-------|
| 16px | `w-4 h-4` | Inline icons |
| 20px | `w-5 h-5` | Button icons |
| 24px | `w-6 h-6` | Default icons |
| 32px | `w-8 h-8` | Large icons |
| 48px | `w-12 h-12` | Hero icons |

### Icon Colors

```tsx
{/* Brand icon */}
<Zap className="text-brand-electric" />

{/* Muted icon */}
<Info className="text-muted-foreground" />

{/* Semantic icons */}
<CheckCircle className="text-brand-success" />
<AlertCircle className="text-brand-warning" />
<XCircle className="text-brand-danger" />
```

---

## Component Patterns

### Payment Card

```tsx
<div className="card-pika p-6 space-y-4">
  <div className="flex items-center justify-between">
    <span className="text-sm text-muted-foreground">Sent to</span>
    <Badge variant="success">Completed</Badge>
  </div>
  <div className="text-2xl font-mono-number font-semibold">
    -$125.00
  </div>
  <div className="flex items-center gap-3">
    <Avatar className="h-8 w-8" />
    <div>
      <p className="font-medium">Sarah Wilson</p>
      <p className="text-sm text-muted-foreground">Today, 2:34 PM</p>
    </div>
  </div>
</div>
```

### Action Button with Icon

```tsx
<button className="btn-primary gap-2">
  <Zap className="w-4 h-4" />
  <span>Send Instantly</span>
</button>
```

### Status Badge

```tsx
<Badge className="badge-success">Payment Complete</Badge>
<Badge className="badge-warning">Processing</Badge>
<Badge className="badge-brand">Instant Transfer</Badge>
```

### Amount Display

```tsx
{/* Positive (incoming) */}
<div className="amount-positive">+$500.00</div>

{/* Negative (outgoing) */}
<div className="amount-negative">-$250.00</div>

{/* Neutral */}
<div className="amount-display">$1,234.56</div>
```

---

## Animations

### Duration

| Speed | Duration | Usage |
|-------|----------|-------|
| Fast | 150ms | Micro-interactions (hover, focus) |
| Base | 200ms | UI transitions |
| Slow | 300ms | Page transitions, modals |
| Slower | 400ms | Complex animations |

### Easing

| Function | Usage |
|----------|-------|
| `ease-out` | Most animations (natural exit) |
| `ease-in` | Rare (draws attention to entry) |
| `ease-in-out` | Long transitions |
| `cubic-bezier(...)` | Special effects (bounce, elastic) |

### Available Animations

```tsx
// Page transitions
"fade-in"
"slide-up"
"slide-down"
"scale-in"

// Payment animations
"success-bounce"
"fly-in"
"fly-out"

// Loading
"pulse"
"shimmer"
"pulse-slow"

// Accordion
"accordion-down"
"accordion-up"
```

---

## Responsive Design

### Breakpoints

| Name | Min Width | Usage |
|------|-----------|-------|
| `sm` | 640px | Small tablets |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

### Mobile-First Approach

```tsx
// Mobile: 1 column, tablet: 2 columns, desktop: 3 columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>

// Responsive text
<h1 className="text-2xl md:text-4xl lg:text-6xl">
  Title
</h1>
```

---

## Accessibility

### Focus States

All interactive elements must have visible focus states:
```tsx
<button className="focus-ring">
  {/* 2px primary ring with offset */}
</button>
```

### Color Contrast

- **Body text:** 4.5:1 minimum (WCAG AA)
- **Large text:** 3:1 minimum
- **Interactive elements:** 3:1 minimum

### Touch Targets

- **Minimum size:** 44×44px
- **Spacing:** 8px between targets
- **Buttons:** At least 42px height

### Screen Readers

```tsx
<button aria-label="Send payment">
  <Zap aria-hidden="true" />
</button>
```

---

## Dark Mode

All components support dark mode via the `.dark` class:

```tsx
// Toggle dark mode
document.documentElement.classList.toggle('dark')
```

### Dark Mode Adjustments

- **Primary colors:** Lighter (+5% lightness)
- **Shadows:** Removed or reduced
- **Borders:** More subtle (lower opacity)
- **Text:** Higher contrast

---

## Best Practices

### DO ✅

- Use tabular numbers for amounts
- Provide immediate feedback for all actions
- Use semantic color names (success, warning, danger)
- Maintain consistent spacing
- Test at 200% zoom for accessibility
- Use animation delays thoughtfully (stagger effects)

### DON'T ❌

- Don't use color alone to convey meaning
- Don't animate important text (readability)
- Don't use red/green without text labels
- Don't mix multiple animation types
- Don't skip hover states on desktop
- Don't forget loading states

---

## File Structure

```
src/
├── assets/
│   ├── pika-logo.svg        # Full logo with text
│   ├── pika-icon.svg        # App icon (64x64)
│   └── pika-wordmark.svg    # Text-only logo
├── components/
│   ├── ui/                  # Reusable UI components
│   ├── payments/            # Payment-specific components
│   └── layout/              # Layout components
├── styles/
│   └── index.css            # Global styles + design tokens
└── lib/
    └── utils.ts             # Utility functions (cn, formatCurrency, etc.)
```

---

## Usage Examples

### Quick Start

```tsx
// 1. Import design system classes
import { cn } from '@/lib/utils'

// 2. Use card pattern
export function PaymentCard({ amount, recipient, status }) {
  return (
    <div className="card-pika p-6 space-y-4 hover-lift cursor-pointer">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Sent to</span>
        <Badge className={status === 'complete' ? 'badge-success' : 'badge-warning'}>
          {status}
        </Badge>
      </div>
      <div className="amount-negative text-2xl">
        -{formatCurrency(amount)}
      </div>
      <div className="flex items-center gap-3">
        <Avatar src={recipient.avatar} className="h-8 w-8" />
        <div>
          <p className="font-medium">{recipient.name}</p>
          <p className="text-sm text-muted-foreground">{recipient.time}</p>
        </div>
      </div>
    </div>
  )
}
```

### Build a Button

```tsx
export function SendButton({ loading, onClick }) {
  return (
    <button
      className={cn(
        "btn-primary w-full gap-2",
        loading && "opacity-50 cursor-not-allowed"
      )}
      onClick={onClick}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Sending...</span>
        </>
      ) : (
        <>
          <Zap className="w-4 h-4" />
          <span>Send Payment</span>
        </>
      )}
    </button>
  )
}
```

---

## Design Principles Summary

1. **Clarity Over Cleverness** - Clear information hierarchy trumps clever animations
2. **Instant Feedback** - Every action gets immediate visual response
3. **Progressive Enhancement** - Core functionality works without animations
4. **Fintech Trust** - Professional colors, clear states, secure appearance
5. **Speed as Feature** - Fast animations, instant transitions, responsive design
6. **Accessibility First** - WCAG AA compliance, semantic HTML, keyboard navigation

---

## Version

**v1.0.0** - Initial design system for Pika payment app

Last updated: 2025-02-05
