import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as h3 from 'h3'
import { vi } from 'vitest'

/**
 * Serves the real API route handlers from an h3 app backed by a fresh SQLite file, so tests
 * can call endpoints over HTTP the way the app does. Nitro's auto-imports are provided as
 * globals: the h3 utilities themselves, and `useRuntimeConfig` pointing at the test database.
 */
export async function startApi() {
  const databaseUrl = `file:${join(mkdtempSync(join(tmpdir(), 'lintocracy-test-')), 'test.db')}`
  const runtimeConfig = { databaseUrl, adminSecret: 'test-admin-secret' }

  for (const name of [
    'defineEventHandler',
    'getRouterParam',
    'createError',
    'readBody',
    'getQuery',
    'getCookie',
    'setCookie',
  ] as const) {
    vi.stubGlobal(name, h3[name])
  }
  vi.stubGlobal('useRuntimeConfig', () => runtimeConfig)

  const { ensureSchema } = await import('../db')
  await ensureSchema()

  const routes: [method: 'get' | 'post' | 'delete', path: string, file: Promise<{ default: h3.EventHandler }>][] = [
    ['post', '/api/groups', import('../api/groups/index.post')],
    ['post', '/api/groups/by-invite/:token/join', import('../api/groups/by-invite/[token]/join.post')],
    ['delete', '/api/groups/:id/votes', import('../api/groups/[id]/votes.delete')],
    ['post', '/api/votes', import('../api/votes/index.post')],
    ['get', '/api/votes/summary', import('../api/votes/summary.get')],
    ['post', '/api/option-votes', import('../api/option-votes/index.post')],
    ['get', '/api/option-votes/summary', import('../api/option-votes/summary.get')],
  ]
  const router = h3.createRouter()
  for (const [method, path, file] of routes) router[method](path, (await file).default)
  const handle = h3.toWebHandler(h3.createApp().use(router))

  /** A client with its own cookie jar, like one browser. */
  function browser() {
    const cookies = new Map<string, string>()

    async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
      const headers = new Headers({ cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join('; ') })
      if (body !== undefined) headers.set('content-type', 'application/json')
      const res = await handle(
        new Request(`http://localhost${path}`, {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
        }),
      )
      for (const cookie of res.headers.getSetCookie()) {
        const [pair] = cookie.split(';')
        const eq = pair!.indexOf('=')
        cookies.set(pair!.slice(0, eq), pair!.slice(eq + 1))
      }
      if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${await res.text()}`)
      return (await res.json()) as T
    }

    return {
      get: <T>(path: string) => request<T>('GET', path),
      post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
      delete: <T>(path: string) => request<T>('DELETE', path),
    }
  }

  return { browser }
}
