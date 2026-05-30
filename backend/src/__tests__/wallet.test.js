import { describe, it, expect } from 'vitest'
import { Wallet } from '../models/Wallet.js'

describe('Wallet (orchestration-only)', () => {
  it('creates a synthetic zero-balance wallet', async () => {
    const wallet = await Wallet.create('user-1')
    expect(wallet.balance).toBe(0)
    expect(wallet.user_id).toBe('user-1')
    expect(wallet.currency).toBe('MXN')
    expect(wallet.is_active).toBe(true)
  })

  it('findByUserId returns synthetic wallet', async () => {
    const wallet = await Wallet.findByUserId('user-2')
    expect(wallet.balance).toBe(0)
    expect(wallet.user_id).toBe('user-2')
  })

  it('never holds a customer balance', async () => {
    const wallet = await Wallet.findByUserId('any-user')
    expect(wallet.balance).toBe(0)
  })
})
