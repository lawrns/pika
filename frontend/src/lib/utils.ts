import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge Tailwind classes with proper precedence
 * Usage: cn('base-class', conditional && 'conditional-class', 'override-class')
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency with proper formatting
 * @param amount - Amount in dollars
 * @param currency - Currency code (default: MXN)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'MXN'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Format amount for display (no currency symbol)
 * @param amount - Amount in dollars
 * @returns Formatted number string
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param date - Date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  }
  return 'Just now'
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param length - Max length (default: 50)
 * @returns Truncated text
 */
export function truncate(text: string, length: number = 50): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

/**
 * Get initials from name
 * @param name - Full name
 * @returns Initials (max 2 characters)
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

/**
 * Generate a gradient class based on index
 * @param index - Index for variation
 * @returns Gradient class string
 */
export function getGradientClass(index: number): string {
  const gradients = [
    'from-brand-electric to-brand-trust',
    'from-brand-success to-brand-trust',
    'from-brand-electric to-brand-success',
    'from-brand-trust to-brand-electric'
  ]
  return gradients[index % gradients.length]
}

/**
 * Check if color is light (for text contrast)
 * @param hex - Hex color code
 * @returns True if color is light
 */
export function isLightColor(hex: string): boolean {
  const c = hex.substring(1)      // strip #
  const rgb = parseInt(c, 16)     // convert rrggbb to decimal
  const r = (rgb >> 16) & 0xff    // extract red
  const g = (rgb >>  8) & 0xff    // extract green
  const b = (rgb >>  0) & 0xff    // extract blue
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b // per ITU-R BT.709
  return luma > 150
}

/**
 * Delay utility for animations
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Format phone number
 * @param phone - Phone number string
 * @returns Formatted phone number
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3]
  }
  return phone
}

/**
 * Validate email format
 * @param email - Email string
 * @returns True if valid email
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

/**
 * Calculate percentage change
 * @param current - Current value
 * @param previous - Previous value
 * @returns Percentage change
 */
export function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

/**
 * Clamp number between min and max
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Generate ID
 * @returns Random ID string
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Sleep alias for delay
 */
export const sleep = delay
