import { describe, it, expect, beforeEach } from 'vitest'
import { validateAndSetConfig, getConfig, isInitialized } from '../config'

// reset module state between tests
function resetConfig() {
  // @ts-expect-error — accessing module-private state for test reset
  const mod = require('../config')
}

describe('config', () => {
  it('rejects missing apiKey', () => {
    expect(() =>
      validateAndSetConfig({ apiKey: '', service: 'svc' })
    ).toThrow()
  })

  it('rejects missing service', () => {
    expect(() =>
      validateAndSetConfig({ apiKey: 'pk_live_xxx', service: '' })
    ).toThrow()
  })

  it('accepts valid config with defaults', () => {
    const config = validateAndSetConfig({
      apiKey: 'pk_live_xxx',
      service: 'test-service',
    })
    expect(config.apiKey).toBe('pk_live_xxx')
    expect(config.service).toBe('test-service')
    expect(config.maxLogLines).toBe(100)
    expect(config.debug).toBe(false)
    expect(config.enabled).toBe(true)
  })

  it('accepts optional overrides', () => {
    const config = validateAndSetConfig({
      apiKey: 'pk_live_xxx',
      service: 'test-service',
      environment: 'staging',
      release: '1.2.3',
      maxLogLines: 50,
      debug: true,
      enabled: false,
    })
    expect(config.environment).toBe('staging')
    expect(config.release).toBe('1.2.3')
    expect(config.maxLogLines).toBe(50)
    expect(config.debug).toBe(true)
    expect(config.enabled).toBe(false)
  })

  it('rejects maxLogLines above 1000', () => {
    expect(() =>
      validateAndSetConfig({ apiKey: 'pk_live_xxx', service: 'svc', maxLogLines: 9999 })
    ).toThrow()
  })

  it('sets config retrievable via getConfig()', () => {
    validateAndSetConfig({ apiKey: 'pk_live_abc', service: 'my-svc' })
    const config = getConfig()
    expect(config.apiKey).toBe('pk_live_abc')
  })

  it('isInitialized returns true after init', () => {
    validateAndSetConfig({ apiKey: 'pk_live_xxx', service: 'svc' })
    expect(isInitialized()).toBe(true)
  })
})
