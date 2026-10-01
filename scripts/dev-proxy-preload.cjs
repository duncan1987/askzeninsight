// Split-routing proxy preload for Node's global fetch.
//
// Why: on this machine Supabase (*.supabase.co) is unreachable directly
// (GFW) and must go through the local proxy, while Google Fonts
// (fonts.gstatic.com, used by Turbopack at compile time) and domestic
// endpoints FAIL through that same proxy and must stay direct.
//
// How: wrap global fetch; pick the undici dispatcher per request host.
// - hosts listed in env PROXY_HOSTS, or derived from NEXT_PUBLIC_SUPABASE_URL
//   / SUPABASE_URL in <cwd>/.env(.local), go through the ProxyAgent
//   (with retry + re-assertion, since Next resets undici's global dispatcher).
// - everything else uses a plain direct Agent.
// The set->fetch sequence is synchronous, so per-call setGlobalDispatcher
// cannot interleave with other requests.
const fs = require('fs')
const path = require('path')
try {
  fs.appendFileSync(
    path.join(__dirname, 'preload.log'),
    `${new Date().toISOString()} pid=${process.pid} cmd=${(process.argv || []).join(' ').slice(0, 120)}\n`
  )
} catch {}

function loadEnvHosts() {
  const hosts = new Set()
  const addUrl = (raw) => {
    if (!raw) return
    try { hosts.add(new URL(raw).hostname) } catch {}
  }
  // Environment takes priority (if the caller exported vars)
  addUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  addUrl(process.env.SUPABASE_URL)
  for (const extra of (process.env.PROXY_HOSTS || '').split(',')) {
    if (extra.trim()) hosts.add(extra.trim())
  }
  // Fall back to reading .env / .env.local from the working directory
  if (hosts.size === 0) {
    for (const f of ['.env.local', '.env']) {
      try {
        const text = fs.readFileSync(path.join(process.cwd(), f), 'utf8')
        const m1 = text.match(/^NEXT_PUBLIC_SUPABASE_URL=(\S+)/m)
        const m2 = text.match(/^SUPABASE_URL=(\S+)/m)
        if (m1) addUrl(m1[1])
        if (m2) addUrl(m2[1])
        if (hosts.size > 0) break
      } catch {}
    }
  }
  return hosts
}

const PROXY_HOSTS = loadEnvHosts()
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || 'http://127.0.0.1:7897'

const { ProxyAgent, Agent, setGlobalDispatcher } = require('undici')
const proxyAgent = new ProxyAgent({
  uri: proxyUrl,
  connect: { timeout: 30000 },
  headersTimeout: 60000,
  bodyTimeout: 120000,
})
const directAgent = new Agent()

const sym = Symbol.for('undici.globalDispatcher.1')
const origFetch = globalThis.fetch.bind(globalThis)
const RETRY_DELAYS = [500, 1500, 3000, 5000]
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function getUrl(input) {
  try {
    if (typeof input === 'string') return input
    if (input && typeof input.url === 'string') return input.url
    if (input && typeof input.href === 'string') return input.href
  } catch {}
  return ''
}

function shouldProxy(url) {
  try { return PROXY_HOSTS.has(new URL(url).hostname) } catch { return false }
}

globalThis.fetch = async function (input, init) {
  const url = getUrl(input)
  const useProxy = shouldProxy(url)
  // Re-assert the dispatcher for this request (Next may have replaced it).
  try {
    setGlobalDispatcher(useProxy ? proxyAgent : directAgent)
  } catch {}
  if (!useProxy) {
    return origFetch(input, init)
  }
  // Proxied requests: the upstream proxy is flaky on new TLS connections
  // (~40% reset). Failures happen at connect time (ECONNRESET /
  // UND_ERR_SOCKET before response headers), so the request was never
  // delivered and retrying is safe.
  let lastErr
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    if (attempt > 0) await sleep(RETRY_DELAYS[attempt - 1])
    try {
      return await origFetch(input, init)
    } catch (err) {
      lastErr = err
      const code = err && err.cause && (err.cause.code || err.cause.message)
      const retryable =
        code === 'ECONNRESET' ||
        code === 'ECONNREFUSED' ||
        code === 'ETIMEDOUT' ||
        code === 'UND_ERR_SOCKET' ||
        code === 'UND_ERR_CONNECT_TIMEOUT' ||
        (err && err.name === 'TypeError' && err.message === 'fetch failed' && !err.cause)
      if (!retryable) throw err
    }
  }
  throw lastErr
}
