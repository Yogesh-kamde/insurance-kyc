const request = require('supertest')
const app = require('../app')   // adjust path if your app export differs

// Mock the Fabric Gateway and MongoDB models the same way your other
// route tests do, so /auth/login doesn't try to hit a real network or DB.
jest.mock('../utils/fabric')
jest.mock('../models/User')

describe('POST /auth/login rate limiting', () => {
  it('blocks the 6th attempt within the window', async () => {
    const payload = { username: 'customer1', password: 'wrongpass' }

    // Burn through the allowed 5 attempts first
    for (let i = 0; i < 5; i++) {
      await request(app).post('/auth/login').send(payload)
    }

    // The 6th should be rejected by the limiter, not by auth logic
    const res = await request(app).post('/auth/login').send(payload)
    expect(res.status).toBe(429)
    expect(res.body.error).toMatch(/too many attempts/i)
  })
})