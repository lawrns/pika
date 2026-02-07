# CSS Reference - Pika Design System

## Custom Component Classes

### Buttons

```css
.btn-primary
  - Primary action button
  - Electric violet background
  - White text
  - Smooth hover/active transitions
  - Scale down on click (active:scale-95)

.btn-secondary
  - Secondary action button
  - Gray background
  - Dark text
  - Subtle hover effect

.btn-ghost
  - Tertiary button
  - Transparent background
  - Hover shows accent background
```

### Cards

```css
.card-pika
  - Base card component
  - Rounded: 16px
  - Subtle border
  - Medium shadow

.card-pika-hover
  - Interactive card
  - Elevates on hover (-translate-y-0.5)
  - Shadow increases
  - Smooth transition
```

### Inputs

```css
.input-pika
  - Height: 44px (touch-friendly)
  - Rounded: 12px
  - Focus ring: 2px primary
  - Smooth transitions on all states
  - Placeholder: muted-foreground
```

### Badges

```css
.badge
  - Base badge class
  - Rounded-full (pill shape)
  - Inline-flex alignment
  - Font size: xs
  - Font weight: medium

.badge-success
  - Green background (10% opacity)
  - Green text
  - For completed payments

.badge-warning
  - Amber background
  - Amber text
  - For pending transactions

.badge-danger
  - Red background
  - Red text
  - For failed payments

.badge-brand
  - Electric violet background
  - Electric violet text
  - For brand features
```

## Animation Classes

### Payment Animations

```css
.payment-success
  - Bounce animation (0.6s)
  - Cubic-bezier easing
  - Scale: 1 → 1.1 → 1

.payment-fly-in
  - Slide in from right (100%)
  - Duration: 400ms
  - Elastic easing

.payment-fly-out
  - Slide out to left (-100%)
  - Duration: 300ms
  - Ease-in
```

### Loading States

```css
.skeleton
  - Pulse animation
  - Muted background
  - Rounded corners

.skeleton-text
  - Height: 16px
  - Width: 100%

.skeleton-circle
  - Circular skeleton
  - Full rounded

.shimmer
  - Background gradient animation
  - Direction: left to right
  - Duration: 2s
  - Linear easing
```

### Hover Effects

```css
.hover-lift
  - Translate Y: -4px on hover
  - Duration: 200ms
  - Creates elevation effect

.hover-glow
  - Adds colored glow shadow
  - Primary color glow
  - Smooth transition
```

### Focus States

```css
.focus-ring
  - Outline: none
  - Ring: 2px primary
  - Ring offset: 2px
  - Only visible on keyboard focus
```

### Ripple Effect

```css
.ripple
  - Position: relative
  - Overflow: hidden
  - Creates expanding circle on click
  - Primary color with 30% opacity
  - Fade out transition: 1s
```

## Utility Classes

### Glassmorphism

```css
.glass
  - Backdrop blur: 12px
  - Background: 80% opacity
  - Border: 50% opacity
  - Frosted glass effect
```

### Gradient Text

```css
.text-gradient
  - Background: linear gradient
  - From: electric violet
  - To: trust blue
  - Background clip: text
  - Transparent fill
```

### Glow Effects

```css
.glow-sm
  - Small glow shadow (20px spread)

.glow-md
  - Medium glow shadow (40px spread)

.glow-lg
  - Large glow shadow (60px spread)
```

### Aspect Ratios

```css
.aspect-square
  - 1:1 ratio

.aspect-video
  - 16:9 ratio

.aspect-payment
  - 1.586:1 (credit card ratio)
```

### Scrollbar Styling

```css
.scrollbar-thin
  - Scrollbar width: 6px
  - Custom track and thumb
  - Muted colors
  - Hover increases opacity
  - Webkit and Firefox support
```

## Special Component Styles

### Credit Card Pattern

```css
.card-pattern
  - Subtle radial gradients
  - White dots at 10% opacity
  - Creates depth
  - Overlay on gradient backgrounds
```

### Payment Status Indicators

```css
.status-dot
  - Size: 8px
  - Rounded-full

.status-dot-success
  - Green background
  - Pulse animation

.status-dot-pending
  - Amber background
  - Pulse animation

.status-dot-error
  - Red background
  - No animation (static)
```

### Number Formatting

```css
.amount-display
  - Font: monospace (tabular-nums)
  - Font weight: 600 (semibold)
  - Tracking: tight (-0.025em)

.amount-positive
  - Inherits amount-display
  - Color: brand-success

.amount-negative
  - Inherits amount-display
  - Color: foreground (dark)
```

## Layout Utilities

### Container

```css
.container-pika
  - Max width: 1280px (7xl)
  - Centered with auto margins
  - Padding responsive:
    * Mobile: 16px (px-4)
    * Small: 24px (sm:px-6)
    * Large: 32px (lg:px-8)
```

## Animation Delays

```css
.stagger-1 through .stagger-4
  - Delay: 0.1s to 0.4s
  - For sequential animations
  - Use on list items, cards, etc.
```

## Page Transitions

```css
.page-enter
  - Fade in animation
  - Duration: 200ms
  - Ease-out

.page-exit
  - Opacity: 0
  - For exit transitions
```

## List Animations

```css
.list-item-enter
  - Slide up animation
  - From: 10px down + opacity 0
  - Duration: 300ms
  - Ease-out
```

## Responsive Text

```css
.text-responsive
  - Mobile: 18px (text-lg)
  - Tablet: 20px (sm:text-xl)
  - Desktop: 24px (lg:text-2xl)
```

## Using These Classes

### Import in Components

```tsx
// No import needed - all available globally
// Just use the classes directly

function MyComponent() {
  return (
    <div className="card-pika p-6 hover-lift">
      <button className="btn-primary ripple">
        Click me
      </button>
    </div>
  )
}
```

### Combining Classes

```tsx
// Combine base classes with variants
<div className="card-pika hover-lift cursor-pointer">
  {/* Interactive card with hover effect */}
</div>

// Stack animations
<div className="payment-success animate-fade-in">
  {/* Success bounce + fade in */}
</div>

// Use utility classes
<button className="btn-primary focus-ring hover-glow">
  {/* Primary button with focus ring and glow */}
</button>
```

### Conditional Classes

```tsx
import { cn } from '@/lib/utils'

function StatusBadge({ status }) {
  return (
    <span className={cn(
      'badge',
      status === 'success' && 'badge-success',
      status === 'warning' && 'badge-warning',
      status === 'danger' && 'badge-danger'
    )}>
      {status}
    </span>
  )
}
```

## Custom Properties Available

```css
/* Colors */
--background
--foreground
--primary
--primary-foreground
--primary-glow
--secondary
--secondary-foreground
--muted
--muted-foreground
--accent
--accent-foreground
--border
--input
--ring
--card
--card-foreground
--destructive
--destructive-foreground
--popover
--popover-foreground

/* Brand Colors */
--brand-electric
--brand-trust
--brand-success
--brand-warning
--brand-danger

/* Payment States */
--payment-incoming
--payment-outgoing
--payment-pending

/* UI Properties */
--radius
--shadow
```

## Dark Mode Support

All classes automatically adapt to dark mode:

```tsx
// Toggles dark mode on <html>
document.documentElement.classList.toggle('dark')

// All components respond automatically
<div className="card-pika">
  {/* Light: white card, dark: dark card */}
</div>
```

## Performance Tips

1. **Use CSS animations** over JavaScript when possible
2. **Transform and opacity** for smooth 60fps animations
3. **Will-change** sparingly (only when needed)
4. **Prefer className** over inline styles
5. **Use animation variants** instead of custom keyframes

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid, Flexbox, Custom Properties supported
- `backdrop-filter` needs `-webkit-` prefix for Safari
- All animations GPU-accelerated (transform/opacity)
