import type { RequestContext, RequestPayload } from '../types'

const BLOCKED_HEADERS = new Set([
  'authorization',
  'cookie',
  'x-api-key',
  'x-auth-token',
  'x-access-token',
  'x-secret',
  'proxy-authorization',
])

export function sanitizePath(url: string): string {
  // strip query string — never capture query param values
  return (url || '').split('?')[0]
}

export function buildRequestPayload(ctx: RequestContext): RequestPayload {
  return {
    method: ctx.method,
    path: ctx.path,
    statusCode: ctx.statusCode,
    durationMs: ctx.startTime ? Date.now() - ctx.startTime : undefined,
  }
}

export function isBlockedHeader(name: string): boolean {
  return BLOCKED_HEADERS.has(name.toLowerCase())
}
