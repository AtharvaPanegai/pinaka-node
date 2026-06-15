import { getConfig, isInitialized } from '../config'
import { getRecentLogs } from './logs'
import { buildRequestPayload } from './request'
import { send } from '../transport/http'
import type { ErrorOptions, PinakaPayload } from '../types'
import * as os from 'os'

const SDK_VERSION = '0.1.0'

export function captureError(error: unknown, options: ErrorOptions = {}): void {
  try {
    if (!isInitialized()) return
    const config = getConfig()
    if (!config.enabled) return

    const err = normalizeError(error)
    const requestCtx = options.request
    const payload: PinakaPayload = {
      apiKey: config.apiKey,
      service: config.service,
      environment: config.environment,
      language: 'node',
      sdkVersion: SDK_VERSION,
      error: {
        message: err.message,
        type: err.name || 'Error',
        stackTrace: err.stack || '',
        handled: options.handled ?? true,
      },
      context: {
        request: requestCtx ? buildRequestPayload(requestCtx) : null,
        recentLogs: getRecentLogs(),
        commitSha: process.env.GIT_COMMIT || process.env.COMMIT_SHA || undefined,
        serviceName: config.service,
        serviceVersion: config.release,
        hostname: os.hostname(),
        timestamp: new Date().toISOString(),
        traceId: undefined,
      },
    }

    if (config.debug) {
      console.error('[Pinaka] Capturing error:', err.message)
    }

    send(payload)
  } catch {
    // SDK must never crash the host application
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  captureError(new Error(message), { handled: true })
}

export function attachGlobalHandlers(): void {
  process.on('uncaughtException', (error: Error) => {
    captureError(error, { handled: false })
  })

  process.on('unhandledRejection', (reason: unknown) => {
    captureError(reason instanceof Error ? reason : new Error(String(reason)), { handled: false })
  })
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) return error
  if (typeof error === 'string') return new Error(error)
  try {
    return new Error(JSON.stringify(error))
  } catch {
    return new Error('Unknown error')
  }
}
