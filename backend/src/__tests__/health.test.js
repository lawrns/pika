import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server.js'

describe('GET /health', () => {
  it('returns 200 with healthy status', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('healthy')
    expect(res.body).toHaveProperty('timestamp')
    expect(res.body).toHaveProperty('database')
  })
})
