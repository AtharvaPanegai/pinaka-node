import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// must set config before importing transport
import { validateAndSetConfig } from '../config'

const mockFetch = vi.fn()
global.fetch = mockFetch

import { send } from '../transport/http'
import type { PinakaPayload } from '../types'

const samplePayload: PinakaPayload = {
  apiKey: 'pk_live_test',
  service: 'test-service',
  environment: 'test',
  language: 'node',
  sdkVersion: '0.1.0',
  error: {
    message: 'Test error',
    type: 'Error',
    stackTrace: 'Error: Test\n    at test:1:1',
    handled: true,
  },
  context: {
    recentLogs: ['2026-01-01T00:00:00Z INFO test log'],
    serviceName: 'test-service',
    hostname: 'test-host',
    timestamp: '2026-01-01T00:00:00Z',
  },
}

beforeEach(() => {
  validateAndSetConfig({ apiKey: 'pk_live_test', service: 'test-service', debug: false })
  mockFetch.mockReset()
})

describe('transport', () => {
  it('sends POST to Pinaka API', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 })
    send(samplePayload)
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalledOnce())
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toBe('https://api.getpinaka.com/v1/ingest')
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body)).toMatchObject({ apiKey: 'pk_live_test' })
  })

  it('does not retry on 401', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401 })
    send(samplePayload)
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalledOnce())
    // only 1 call — no retry on auth failure
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('retries up to 3 times on 500', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 })
    vi.useFakeTimers()
    send(samplePayload)
    // advance timers past all retry backoffs
    await vi.runAllTimersAsync()
    vi.useRealTimers()
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('does not throw on network failure', async () => {
    mockFetch.mockRejectedValue(new Error('network error'))
    vi.useFakeTimers()
    expect(() => send(samplePayload)).not.toThrow()
    await vi.runAllTimersAsync()
    vi.useRealTimers()
  })

  it('is fire-and-forget — send() returns void immediately', () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 })
    const result = send(samplePayload)
    expect(result).toBeUndefined()
  })
})
