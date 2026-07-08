import { z } from 'zod'
import type { PinakaConfig } from './types'

const configSchema = z.object({
  apiKey: z.string().min(1, 'apiKey is required'),
  service: z.string().min(1, 'service is required'),
  // Copy from the Repositories page in your Garuda dashboard.
  // When provided, repo resolution is exact — no name matching needed.
  repoId: z.string().optional(),
  environment: z.string().optional(),
  release: z.string().optional(),
  maxLogLines: z.number().int().positive().max(1000).optional(),
  debug: z.boolean().optional(),
  enabled: z.boolean().optional(),
})

let _config: Required<PinakaConfig> | null = null

export function validateAndSetConfig(raw: PinakaConfig): Required<PinakaConfig> {
  const parsed = configSchema.parse(raw)
  _config = {
    apiKey: parsed.apiKey,
    service: parsed.service,
    repoId: parsed.repoId ?? '',
    environment: parsed.environment ?? process.env.NODE_ENV ?? 'production',
    release: parsed.release ?? process.env.npm_package_version ?? 'unknown',
    maxLogLines: parsed.maxLogLines ?? 100,
    debug: parsed.debug ?? false,
    enabled: parsed.enabled ?? true,
  }
  return _config
}

export function getConfig(): Required<PinakaConfig> {
  if (!_config) {
    throw new Error('[Pinaka] SDK not initialized — call Pinaka.init() first')
  }
  return _config
}

export function isInitialized(): boolean {
  return _config !== null
}
