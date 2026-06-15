import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))
vi.mock('../transport/http', () => ({ send: mockSend }))

import { validateAndSetConfig } from '../config'
import { captureError } from '../capture/error'

beforeEach(() => {
  validateAndSetConfig({ apiKey: 'pk_live_test', service: 'test-service', enabled: true })
  mockSend.mockReset()
})

describe('captureError', () => {
  it('sends payload for an Error instance', () => {
    captureError(new Error('test error'))
    expect(mockSend).toHaveBeenCalledOnce()
    const payload = mockSend.mock.calls[0][0]
    expect(payload.error.message).toBe('test error')
    expect(payload.error.type).toBe('Error')
    expect(payload.language).toBe('node')
  })

  it('handles non-Error thrown values', () => {
    captureError('string error')
    expect(mockSend).toHaveBeenCalledOnce()
    expect(mockSend.mock.calls[0][0].error.message).toBe('string error')
  })

  it('marks handled:false for unhandled exceptions', () => {
    captureError(new Error('crash'), { handled: false })
    const payload = mockSend.mock.calls[0][0]
    expect(payload.error.handled).toBe(false)
  })

  it('does nothing when enabled:false', () => {
    validateAndSetConfig({ apiKey: 'pk_live_test', service: 'svc', enabled: false })
    captureError(new Error('should be ignored'))
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('includes context fields in payload', () => {
    captureError(new Error('ctx test'))
    const payload = mockSend.mock.calls[0][0]
    expect(payload.context.serviceName).toBe('test-service')
    expect(payload.context.hostname).toBeTruthy()
    expect(payload.context.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(Array.isArray(payload.context.recentLogs)).toBe(true)
  })

  it('never throws even if send throws', () => {
    mockSend.mockImplementation(() => { throw new Error('transport blew up') })
    expect(() => captureError(new Error('safe'))).not.toThrow()
  })
})
