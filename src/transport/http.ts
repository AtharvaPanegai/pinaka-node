import type { PinakaPayload } from '../types'
import { getConfig } from '../config'

const PINAKA_API = 'https://api.getpinaka.com/v1/ingest'

export function send(payload: PinakaPayload): void {
  // fire-and-forget — never blocks the request lifecycle
  sendWithRetry(payload).catch(() => {
    // silently swallow — SDK must never surface errors to the host app
  })
}

async function sendWithRetry(payload: PinakaPayload): Promise<void> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(PINAKA_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      })

      if (res.ok) return

      if (res.status === 401) {
        if (getConfig().debug) {
          console.error('[Pinaka] Invalid API key — check your dashboard at getpinaka.com')
        }
        return
      }

      if (res.status === 429) {
        await sleep(attempt * 2000)
        continue
      }

      if (res.status >= 500) {
        await sleep(attempt * 1000)
        continue
      }

      // 4xx other than 401/429 — don't retry
      if (getConfig().debug) {
        console.error(`[Pinaka] API error ${res.status} — not retrying`)
      }
      return

    } catch (err) {
      if (attempt === 3 && getConfig().debug) {
        console.error('[Pinaka] Failed to send event after 3 attempts:', err)
      }
      await sleep(attempt * 1000)
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
