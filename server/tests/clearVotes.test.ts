import { beforeAll, describe, expect, it } from 'vitest'
import type { OptionTally, RuleTally } from '#shared/types/rule'
import { startApi } from './api'

let api: Awaited<ReturnType<typeof startApi>>

beforeAll(async () => {
  api = await startApi()
})

/** Creates a group; the returned browser is its admin. */
async function newGroup() {
  const admin = api.browser()
  const { id, inviteToken } = await admin.post<{ id: string; inviteToken: string }>('/api/groups', {
    name: 'Team',
    displayName: 'Admin',
    password: 'secret',
  })
  return { id, inviteToken, admin }
}

describe('DELETE /api/groups/:id/votes', () => {
  it('returns zeros when the group has no votes', async () => {
    const { id, admin } = await newGroup()

    expect(await admin.delete(`/api/groups/${id}/votes`)).toEqual({ cleared: 0, clearedOptions: 0 })
  })

  it("reports the group's votes and option votes it cleared", async () => {
    const { id: groupId, inviteToken, admin } = await newGroup()
    const member = api.browser()
    await member.post(`/api/groups/by-invite/${inviteToken}/join`, { name: 'Member' })

    // 3 votes and 2 option votes across two members.
    await admin.post('/api/votes', { groupId, ruleId: 'IDE0003', vote: 'yes', severity: 'warning' })
    await admin.post('/api/votes', { groupId, ruleId: 'IDE0007', vote: 'no' })
    await member.post('/api/votes', { groupId, ruleId: 'IDE0003', vote: 'no' })
    const option = { groupId, ruleId: 'IDE0003', optionName: 'dotnet_style_qualification_for_field' }
    await admin.post('/api/option-votes', { ...option, value: 'true' })
    await member.post('/api/option-votes', { ...option, value: 'false' })

    expect(await admin.delete(`/api/groups/${groupId}/votes`)).toEqual({ cleared: 3, clearedOptions: 2 })
  })

  it("leaves the group with no votes, and other groups' votes alone", async () => {
    const { id: groupId, admin } = await newGroup()
    const other = await newGroup()
    for (const g of [{ groupId, browser: admin }, { groupId: other.id, browser: other.admin }]) {
      await g.browser.post('/api/votes', { groupId: g.groupId, ruleId: 'IDE0003', vote: 'no' })
      await g.browser.post('/api/option-votes', {
        groupId: g.groupId,
        ruleId: 'IDE0003',
        optionName: 'dotnet_style_qualification_for_field',
        value: 'true',
      })
    }

    expect(await admin.delete(`/api/groups/${groupId}/votes`)).toEqual({ cleared: 1, clearedOptions: 1 })

    const totalVotes = async (id: string) =>
      (await admin.get<RuleTally[]>(`/api/votes/summary?groupId=${id}`)).reduce((n, t) => n + t.total, 0)
    const totalOptionVotes = async (id: string) =>
      (await admin.get<OptionTally[]>(`/api/option-votes/summary?groupId=${id}`)).reduce((n, t) => n + t.total, 0)
    expect(await totalVotes(groupId)).toBe(0)
    expect(await totalOptionVotes(groupId)).toBe(0)
    expect(await totalVotes(other.id)).toBe(1)
    expect(await totalOptionVotes(other.id)).toBe(1)
  })
})
