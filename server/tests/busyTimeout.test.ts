import { once } from 'node:events'
import { Worker } from 'node:worker_threads'
import { beforeAll, describe, expect, it } from 'vitest'
import type { RuleTally } from '#shared/types/rule'
import { startApi } from './apiHarness'

let api: Awaited<ReturnType<typeof startApi>>

beforeAll(async () => {
  api = await startApi()
})

/**
 * Takes a write lock on the database from another connection, as a backup or the sqlite3 CLI
 * would, and releases it after `holdMs`. Resolves once the lock is held; `released` resolves
 * once it is gone.
 */
async function holdWriteLock(holdMs: number) {
  const worker = new Worker(new URL('./writeLockHolder.mjs', import.meta.url), {
    workerData: { databaseUrl: api.databaseUrl, holdMs },
  })
  const failed = once(worker, 'error').then(([error]) => Promise.reject(error))
  await Promise.race([once(worker, 'message'), failed])
  return { released: Promise.race([once(worker, 'exit'), failed]) }
}

describe('a write that meets a lock held by another connection', () => {
  it('waits for the lock to be released, then succeeds', async () => {
    const admin = api.browser()
    const { id: groupId } = await admin.post<{ id: string }>('/api/groups', {
      name: 'Team',
      displayName: 'Admin',
      password: 'secret',
    })

    const lock = await holdWriteLock(300)
    await admin.post('/api/votes', { groupId, ruleId: 'IDE0003', vote: 'no' })
    await lock.released

    const tallies = await admin.get<RuleTally[]>(`/api/votes/summary?groupId=${groupId}`)
    expect(tallies.find((t) => t.ruleId === 'IDE0003')?.total).toBe(1)
  })
})
