let logBuffer: string[] = []
let maxLines = 100
let patched = false

export function initLogBuffer(max: number): void {
  maxLines = max

  if (patched) return
  patched = true

  const originalLog = console.log.bind(console)
  const originalWarn = console.warn.bind(console)
  const originalError = console.error.bind(console)
  const originalInfo = console.info.bind(console)

  console.log = (...args: unknown[]) => {
    push(`INFO  ${format(args)}`)
    originalLog(...args)
  }
  console.info = (...args: unknown[]) => {
    push(`INFO  ${format(args)}`)
    originalInfo(...args)
  }
  console.warn = (...args: unknown[]) => {
    push(`WARN  ${format(args)}`)
    originalWarn(...args)
  }
  console.error = (...args: unknown[]) => {
    push(`ERROR ${format(args)}`)
    originalError(...args)
  }
}

function format(args: unknown[]): string {
  return args
    .map(a => (typeof a === 'string' ? a : JSON.stringify(a)))
    .join(' ')
}

function push(line: string): void {
  logBuffer.push(`${new Date().toISOString()} ${line}`)
  if (logBuffer.length > maxLines) {
    logBuffer.shift()
  }
}

export function addLog(line: string): void {
  push(line)
}

export function getRecentLogs(): string[] {
  return [...logBuffer]
}

export function clearLogs(): void {
  logBuffer = []
}
