import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { initLogBuffer, getRecentLogs, clearLogs } from '../capture/logs'

// reset patched state between test files by re-importing fresh
beforeEach(() => {
  clearLogs()
})

describe('log buffer', () => {
  it('captures console.log lines', () => {
    initLogBuffer(100)
    console.log('test message')
    const logs = getRecentLogs()
    expect(logs.some(l => l.includes('INFO') && l.includes('test message'))).toBe(true)
  })

  it('captures console.warn lines', () => {
    initLogBuffer(100)
    console.warn('warning here')
    const logs = getRecentLogs()
    expect(logs.some(l => l.includes('WARN') && l.includes('warning here'))).toBe(true)
  })

  it('captures console.error lines', () => {
    initLogBuffer(100)
    console.error('error here')
    const logs = getRecentLogs()
    expect(logs.some(l => l.includes('ERROR') && l.includes('error here'))).toBe(true)
  })

  it('respects maxLines — drops oldest when full', () => {
    initLogBuffer(5)
    clearLogs()
    for (let i = 0; i < 10; i++) {
      console.log(`line ${i}`)
    }
    const logs = getRecentLogs()
    expect(logs.length).toBe(5)
    // oldest lines should be gone
    expect(logs.some(l => l.includes('line 0'))).toBe(false)
    expect(logs.some(l => l.includes('line 9'))).toBe(true)
  })

  it('getRecentLogs returns a copy — mutations do not affect buffer', () => {
    initLogBuffer(100)
    clearLogs()
    console.log('original')
    const logs = getRecentLogs()
    logs.push('injected')
    expect(getRecentLogs().length).toBe(1)
  })

  it('includes ISO timestamp prefix', () => {
    initLogBuffer(100)
    clearLogs()
    console.log('timestamped')
    const logs = getRecentLogs()
    expect(logs[0]).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})
