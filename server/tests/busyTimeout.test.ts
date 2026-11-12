import { once } from 'node:events'
import { Worker } from 'node:worker_threads'
import { beforeAll, describe, expect, it } from 'vitest'
import type { RuleTally } from '#shared/types/rule'
import { startApi } from './apiHarness'

let api: Awaited<ReturnType<typeof startApi>>

beforeAll(async () => {
  api = await startApi()
})

/** Resolves when the worker exits with code 0, rejects if it errors or exits otherwise. */
async function exited(worker: Worker) {
  const [code] = (await once(worker, 'exit')) as [number]
  if (code !== 0) throw new Error(`lock holder exited with code ${code}`)
}

/**
 * Takes a write lock on the database from another connection, as a backup or the sqlite3 CLI
 * would, and releases it after `holdMs`. Resolves once the lock is held. `released` settles
 * once the lock holder is done, and rejects if it failed; `stop` ends it early.
 */
async function holdWriteLock(holdMs: number) {
  const worker = new Worker(new URL('./writeLockHolder.mjs', import.meta.url), {
    workerData: { databaseUrl: api.databaseUrl, holdMs },
  })
  // `once` rejects on the worker's 'error' event; `exited` settles if it ends without locking.
  const released = exited(worker)
  released.catch(() => {})
  await Promise.race([
    once(worker, 'message'),
    released.then(() => Promise.reject(new Error('lock holder exited before taking the lock'))),
  ])
  return { released, stop: () => worker.terminate() }
}

describe('a write that meets a lock held by another connection', () => {
  // Well under the app's 5 s busy timeout, and the test's timeout is above it, so a request
  // that waits the full busy timeout fails with SQLITE_BUSY rather than a test timeout.
  const holdMs = 300

  it('waits for the lock to be released, then succeeds', { timeout: 15_000 }, async () => {
    const { id: groupId, admin } = await api.newGroup()

    const lock = await holdWriteLock(holdMs)
    try {
      await admin.post('/api/votes', { groupId, ruleId: 'IDE0003', vote: 'no' })
      await lock.released
    } finally {
      await lock.stop()
    }

    const tallies = await admin.get<RuleTally[]>(`/api/votes/summary?groupId=${groupId}`)
    expect(tallies.find((t) => t.ruleId === 'IDE0003')?.total).toBe(1)
  })
})
