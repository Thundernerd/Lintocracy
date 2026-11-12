import { globSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as h3 from 'h3'
import { vi } from 'vitest'

const serverDir = fileURLToPath(new URL('..', import.meta.url))

/**
 * The method and path Nitro serves a handler file at, given its path relative to `server/`:
 * `api/groups/[id]/index.patch.ts` is `PATCH /api/groups/:id`. A file without a method suffix answers every method.
 */
function nitroRoute(file: string): { method?: h3.RouterMethod; path: string } {
  const segments = file.replace(/\.ts$/, '').split(/[\\/]/)
  const match = /^(.*)\.(get|head|post|put|patch|delete|connect|options|trace)$/.exec(segments.at(-1)!)
  if (match) segments[segments.length - 1] = match[1]!
  if (segments.at(-1) === 'index') segments.pop()
  const path = segments
    .map((segment) => segment.replace(/^\[\.\.\.(.+)\]$/, '**:$1').replace(/\[(\w+)\]/g, ':$1'))
    .join('/')
  return { method: match?.[2] as h3.RouterMethod | undefined, path: `/${path}` }
}

/**
 * Serves the real API route handlers from an h3 app backed by a fresh SQLite file, so tests
 * can call endpoints over HTTP the way the app does. Nitro's auto-imports are provided as
 * globals: every h3 export, and `useRuntimeConfig` pointing at the test database. Every file
 * under `server/api` is served at the route Nitro gives it, so a new endpoint needs no edit here.
 *
 * Tests live in `server/tests` rather than beside the handlers because Nitro would serve any
 * file under `server/api` as a route.
 */
export async function startApi() {
  const databaseUrl = `file:${join(mkdtempSync(join(tmpdir(), 'lintocracy-test-')), 'test.db')}`
  const runtimeConfig = { databaseUrl, adminSecret: 'test-admin-secret' }

  for (const [name, value] of Object.entries(h3)) vi.stubGlobal(name, value)
  vi.stubGlobal('useRuntimeConfig', () => runtimeConfig)

  // Waits for the schema setup, as every request does.
  const { useDb } = await import('../db')
  const db = await useDb()

  const router = h3.createRouter()
  for (const file of globSync('api/**/*.ts', { cwd: serverDir })) {
    const { method, path } = nitroRoute(file)
    const handler: { default: h3.EventHandler } = await import(join(serverDir, file))
    router.add(path, handler.default, method)
  }
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
        const nameEnd = pair!.indexOf('=')
        cookies.set(pair!.slice(0, nameEnd), pair!.slice(nameEnd + 1))
      }
      if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${await res.text()}`)
      return (await res.json()) as T
    }

    return {
      get: <T>(path: string) => request<T>('GET', path),
      post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
      patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
      delete: <T>(path: string) => request<T>('DELETE', path),
    }
  }

  /** The database the handlers use, for setting up faults the API cannot cause. */
  return { browser, db }
}
