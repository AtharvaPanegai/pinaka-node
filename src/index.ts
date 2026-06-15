import { validateAndSetConfig, isInitialized, getConfig } from './config'
import { initLogBuffer } from './capture/logs'
import { captureError, captureMessage, attachGlobalHandlers } from './capture/error'
import { handler } from './handler'
import type { PinakaConfig, ErrorOptions, MessageSeverity } from './types'

export type { PinakaConfig, ErrorOptions, MessageSeverity }
export type { PinakaPayload, RequestContext, RequestPayload } from './types'

const Pinaka = {
  /**
   * Initialize the Pinaka SDK.
   *
   * @param config.apiKey     - Required. Your org's API key from the Integrations page.
   * @param config.service    - Required. Name of this service — should match your GitHub repo name.
   *                           Hyphens, underscores and casing differences are handled automatically.
   * @param config.environment - Optional. Defaults to `process.env.NODE_ENV`.
   * @param config.release    - Optional. Defaults to `process.env.npm_package_version`.
   * @param config.maxLogLines - Optional. Max log lines to capture (default 100, max 1000).
   * @param config.debug      - Optional. Logs SDK activity to console when true.
   * @param config.enabled    - Optional. Set false to disable the SDK (e.g. in tests).
   */
  init(config: PinakaConfig): void {
    try {
      const validated = validateAndSetConfig(config)
      if (!validated.enabled) return

      initLogBuffer(validated.maxLogLines)
      attachGlobalHandlers()

      if (validated.debug) {
        console.log(`[Pinaka] Initialized — service: ${validated.service}, env: ${validated.environment}`)
      }
    } catch (err) {
      // surface config validation errors — these are developer mistakes, not runtime errors
      console.error('[Pinaka] Initialization failed:', err)
    }
  },

  captureError(error: unknown, options?: ErrorOptions): void {
    captureError(error, options)
  },

  captureMessage(message: string, severity?: MessageSeverity): void {
    captureMessage(message, severity)
  },

  handler,

  isInitialized(): boolean {
    return isInitialized()
  },
}

export default Pinaka
export { Pinaka }
