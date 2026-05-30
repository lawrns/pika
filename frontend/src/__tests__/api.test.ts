import { describe, it, expect } from 'vitest'
import { API_BASE_URL } from '@/lib/api'

describe('API Client', () => {
  it('exports a non-empty API_BASE_URL', () => {
    expect(API_BASE_URL).toBeTruthy()
    expect(typeof API_BASE_URL).toBe('string')
  })

  it('has no trailing slash', () => {
    expect(API_BASE_URL.endsWith('/')).toBe(false)
  })
})
