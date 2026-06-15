import { AsyncLocalStorage } from 'async_hooks'
import { captureError } from './capture/error'
import { sanitizePath } from './capture/request'
import { isInitialized, getConfig } from './config'
import type { RequestContext } from './types'

export const requestContext = new AsyncLocalStorage<RequestContext>()

export function handler() {
  return function universalMiddleware(a: unknown, b: unknown, c: unknown) {
    try {
      if (!isInitialized() || !getConfig().enabled) {
        if (typeof c === 'function') (c as () => void)()
        return
      }

      // ── Fastify (instance passed to addHook) ─────────────────
      if (isFastifyInstance(a)) {
        ;(a as FastifyInstance).addHook('onRequest', (req: any, _reply: any, done: any) => {
          requestContext.run(
            {
              method: req.method,
              path: req.routerPath || sanitizePath(req.url),
              startTime: Date.now(),
            },
            done,
          )
        })
        ;(a as FastifyInstance).addHook('onError', (_req: any, _reply: any, error: any, done: any) => {
          captureError(error, {
            handled: true,
            request: requestContext.getStore(),
          })
          done()
        })
        if (typeof b === 'function') (b as () => void)()
        return
      }

      // ── Koa ──────────────────────────────────────────────────
      if (isKoaContext(a) && typeof b === 'function') {
        const ctx = a as KoaContext
        return requestContext.run(
          {
            method: ctx.method,
            path: ctx.routerPath || ctx.path,
            startTime: Date.now(),
          },
          async () => {
            try {
              await (b as () => Promise<void>)()
            } catch (err) {
              captureError(err as Error, {
                handled: true,
                request: requestContext.getStore(),
              })
              throw err
            }
          },
        )
      }

      // ── Express error handler (4 args) ────────────────────────
      if (a instanceof Error && isExpressResponse(b) && typeof c === 'function') {
        captureError(a, {
          handled: true,
          request: requestContext.getStore(),
        })
        ;(c as (err: unknown) => void)(a)
        return
      }

      // ── Express request middleware (3 args) ───────────────────
      if (isExpressRequest(a) && isExpressResponse(b) && typeof c === 'function') {
        const req = a as ExpressRequest
        return requestContext.run(
          {
            method: req.method,
            path: req.route?.path || sanitizePath(req.path || req.url || ''),
            startTime: Date.now(),
          },
          c as () => void,
        )
      }

      // ── Raw Node.js http ──────────────────────────────────────
      if (isNodeRequest(a) && isNodeResponse(b)) {
        const req = a as NodeRequest
        requestContext.run(
          {
            method: req.method || 'GET',
            path: sanitizePath(req.url || '/'),
            startTime: Date.now(),
          },
          () => {
            if (typeof c === 'function') (c as () => void)()
          },
        )
        return
      }

    } catch {
      // SDK must never crash the host application
      if (typeof c === 'function') (c as () => void)()
    }
  }
}

// ── Type guards ───────────────────────────────────────────────────────────────

interface FastifyInstance { addHook: (event: string, fn: unknown) => void; log: unknown }
interface KoaContext { app: unknown; req: unknown; res: unknown; method: string; path: string; routerPath?: string }
interface ExpressRequest { method: string; path?: string; url?: string; route?: { path: string } }
interface ExpressResponse { send: unknown }
interface NodeRequest { socket: unknown; headers: unknown; method?: string; url?: string }
interface NodeResponse { writeHead: unknown }

function isFastifyInstance(v: unknown): boolean {
  return typeof v === 'object' && v !== null && typeof (v as FastifyInstance).addHook === 'function' && (v as FastifyInstance).log !== undefined
}

function isKoaContext(v: unknown): boolean {
  return typeof v === 'object' && v !== null && (v as KoaContext).app !== undefined && (v as KoaContext).req !== undefined && (v as KoaContext).res !== undefined && typeof (v as KoaContext).method === 'string'
}

function isExpressRequest(v: unknown): boolean {
  return typeof v === 'object' && v !== null && typeof (v as ExpressRequest).method === 'string' && ((v as ExpressRequest).path !== undefined || (v as ExpressRequest).url !== undefined)
}

function isExpressResponse(v: unknown): boolean {
  return typeof v === 'object' && v !== null && typeof (v as ExpressResponse).send === 'function'
}

function isNodeRequest(v: unknown): boolean {
  return typeof v === 'object' && v !== null && (v as NodeRequest).socket !== undefined && (v as NodeRequest).headers !== undefined
}

function isNodeResponse(v: unknown): boolean {
  return typeof v === 'object' && v !== null && typeof (v as NodeResponse).writeHead === 'function'
}
