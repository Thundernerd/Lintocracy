import { beforeAll, describe, expect, it } from 'vitest'
import type { GroupContext } from '#shared/types/group'
import { startApi } from './apiHarness'

let api: Awaited<ReturnType<typeof startApi>>

beforeAll(async () => {
  api = await startApi()
})

describe('PATCH /api/groups/:id', () => {
  it('renames the group', async () => {
    const admin = api.browser()
    const { id } = await admin.post<{ id: string }>('/api/groups', {
      name: 'Team',
      displayName: 'Admin',
      password: 'secret',
    })

    expect(await admin.patch(`/api/groups/${id}`, { name: '  Platform team  ' })).toEqual({
      id,
      name: 'Platform team',
    })
    expect((await admin.get<GroupContext>(`/api/groups/${id}`)).name).toBe('Platform team')
  })

  it('refuses a browser that is not the admin', async () => {
    const admin = api.browser()
    const { id } = await admin.post<{ id: string }>('/api/groups', {
      name: 'Team',
      displayName: 'Admin',
      password: 'secret',
    })

    await expect(api.browser().patch(`/api/groups/${id}`, { name: 'Taken over' })).rejects.toThrow(/-> 403/)
    expect((await admin.get<GroupContext>(`/api/groups/${id}`)).name).toBe('Team')
  })
})
