export interface PinakaConfig {
  apiKey: string
  service: string
  repoId?: string   // from the Repositories page in your Garuda dashboard; takes precedence over service-name matching
  environment?: string
  release?: string
  maxLogLines?: number
  debug?: boolean
  enabled?: boolean
}

export interface RequestContext {
  method: string
  path: string
  startTime: number
  statusCode?: number
}

export interface ErrorOptions {
  handled?: boolean
  tags?: Record<string, string>
  request?: RequestContext
}

export interface RequestPayload {
  method: string
  path: string
  statusCode?: number
  durationMs?: number
}

export interface ErrorPayload {
  message: string
  type: string
  stackTrace: string
  handled: boolean
}

export interface ContextPayload {
  request?: RequestPayload | null
  recentLogs: string[]
  commitSha?: string
  serviceName: string
  serviceVersion?: string
  hostname: string
  timestamp: string
  traceId?: string
}

export interface PinakaPayload {
  apiKey: string
  service: string
  repoId?: string
  environment: string
  language: 'node'
  sdkVersion: string
  error: ErrorPayload
  context: ContextPayload
}

export type MessageSeverity = 'info' | 'warning' | 'error'
