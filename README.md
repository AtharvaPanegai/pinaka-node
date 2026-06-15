# @getpinaka/sdk

Automatic error capture for Node.js applications.  
Sends runtime context to Pinaka for AI-powered root cause analysis.

## Install

```bash
npm install @getpinaka/sdk
```

## Quickstart

```typescript
import Pinaka from '@getpinaka/sdk'

Pinaka.init({
  apiKey: 'pk_live_xxx',       // from getpinaka.com dashboard
  service: 'your-service-name',
})
```

### Express

```typescript
app.use(Pinaka.handler())   // near top — attaches request context
// ... your routes ...
app.use(Pinaka.handler())   // at bottom — catches unhandled errors
```

### Fastify

```typescript
app.addHook('onRequest', Pinaka.handler())
```

### Koa

```typescript
app.use(Pinaka.handler())
```

That's it. Pinaka now automatically captures:
- Unhandled exceptions and promise rejections
- Stack traces with source file references
- Last 100 log lines before any error
- Request context (method, path pattern, status, duration)

## What is captured

| | |
|---|---|
| ✓ | Error message and stack trace |
| ✓ | Last 100 log lines (console.log/warn/error) |
| ✓ | Request method, path pattern, status code, duration |
| ✓ | Git commit SHA (`GIT_COMMIT` or `COMMIT_SHA` env var) |
| ✓ | Service name, version, environment, hostname |

## What is never captured

| | |
|---|---|
| ✗ | Request body or response body |
| ✗ | Authorization, Cookie, or any auth headers |
| ✗ | Query parameter values (only path patterns) |
| ✗ | Database query values |

## Manual capture

```typescript
// Capture a handled error
try {
  await processPayment(order)
} catch (err) {
  Pinaka.captureError(err, { handled: true, tags: { orderId: order.id } })
  throw err
}

// Capture a message
Pinaka.captureMessage('payment gateway timeout after 3 retries', 'warning')
```

## Configuration

```typescript
Pinaka.init({
  apiKey: 'pk_live_xxx',         // required
  service: 'payment-service',    // required
  environment: 'production',     // default: process.env.NODE_ENV
  release: '2.4.1',              // default: process.env.npm_package_version
  maxLogLines: 100,              // default: 100, max: 1000
  debug: false,                  // logs SDK activity — use only in development
  enabled: true,                 // set false to disable entirely (e.g. in tests)
})
```

## Debug mode

```typescript
Pinaka.init({ apiKey: '...', service: '...', debug: true })
// → [Pinaka] Initialized — service: payment-service, env: development
// → [Pinaka] Capturing error: Cannot read properties of null
```

## Disable in tests

```typescript
Pinaka.init({
  apiKey: process.env.PINAKA_API_KEY!,
  service: 'my-service',
  enabled: process.env.NODE_ENV !== 'test',
})
```

## SDK guarantees

- **Never crashes your app** — every internal operation is wrapped in try-catch
- **Never blocks requests** — all API calls are fire-and-forget async
- **Less than 1ms overhead** per request
- **Retry with backoff** — 3 attempts, silent failure if all fail
- **Auth failures are silent** — 401 stops retrying immediately, no noise

## Requirements

Node.js 18+ (uses native `fetch` and `AbortSignal.timeout`)
