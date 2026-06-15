import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockCaptureError } = vi.hoisted(() => ({ mockCaptureError: vi.fn() }))
vi.mock('../capture/error', () => ({
  captureError: mockCaptureError,
  captureMessage: vi.fn(),
  attachGlobalHandlers: vi.fn(),
}))

import { validateAndSetConfig } from '../config'
import { handler, requestContext } from '../handler'

beforeEach(() => {
  validateAndSetConfig({ apiKey: 'pk_live_test', service: 'test-service', enabled: true })
  mockCaptureError.mockReset()
})

describe('handler — Express request middleware', () => {
  it('detects Express request and calls next()', () => {
    const req = { method: 'GET', path: '/test', url: '/test' }
    const res = { send: vi.fn(), json: vi.fn() }
    const next = vi.fn()

    handler()(req, res, next)
    expect(next).toHaveBeenCalledOnce()
  })

  it('stores request context in AsyncLocalStorage', () => {
    const req = { method: 'POST', path: '/api/pay', url: '/api/pay' }
    const res = { send: vi.fn() }
    let captured: ReturnType<typeof requestContext.getStore>

    handler()(req, res, () => {
      captured = requestContext.getStore()
    })

    expect(captured?.method).toBe('POST')
    expect(captured?.path).toBe('/api/pay')
    expect(typeof captured?.startTime).toBe('number')
  })
})

describe('handler — Express error handler (4 args)', () => {
  it('captures error and forwards to next(err)', () => {
    const err = new Error('express crash')
    const req = { method: 'GET', path: '/' }
    const res = { send: vi.fn() }
    const next = vi.fn()

    handler()(err, res, next)
    expect(mockCaptureError).toHaveBeenCalledOnce()
    expect(mockCaptureError.mock.calls[0][0]).toBe(err)
    expect(next).toHaveBeenCalledWith(err)
  })
})

describe('handler — Koa middleware', () => {
  it('detects Koa context and runs next', async () => {
    const ctx = {
      app: {},
      req: {},
      res: {},
      method: 'GET',
      path: '/koa-route',
    }
    const next = vi.fn().mockResolvedValue(undefined)

    await handler()(ctx, next, undefined)
    expect(next).toHaveBeenCalledOnce()
  })

  it('captures error and rethrows in Koa', async () => {
    const ctx = { app: {}, req: {}, res: {}, method: 'POST', path: '/fail' }
    const boom = new Error('koa crash')
    const next = vi.fn().mockRejectedValue(boom)

    await expect(handler()(ctx, next, undefined)).rejects.toThrow('koa crash')
    expect(mockCaptureError).toHaveBeenCalledOnce()
  })
})

describe('handler — disabled SDK', () => {
  it('calls next immediately when disabled', () => {
    validateAndSetConfig({ apiKey: 'pk_live_test', service: 'svc', enabled: false })
    const req = { method: 'GET', path: '/' }
    const res = { send: vi.fn() }
    const next = vi.fn()

    handler()(req, res, next)
    expect(next).toHaveBeenCalledOnce()
    expect(mockCaptureError).not.toHaveBeenCalled()
  })
})
