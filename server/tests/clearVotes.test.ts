import { sql } from 'drizzle-orm'
import { beforeAll, describe, expect, it } from 'vitest'
import type { OptionTally, RuleTally } from '#shared/types/rule'
import { startApi } from './apiHarness'

type Browser = ReturnType<typeof api.browser>

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

/** An option of IDE0003 that takes `true` or `false`. */
const qualificationOption = (groupId: string) => ({
  groupId,
  ruleId: 'IDE0003',
  optionName: 'dotnet_style_qualification_for_field',
})

const sumTotals = (tallies: { total: number }[]) => tallies.reduce((n, t) => n + t.total, 0)

const totalVotes = async (browser: Browser, groupId: string) =>
  sumTotals(await browser.get<RuleTally[]>(`/api/votes/summary?groupId=${groupId}`))

const totalOptionVotes = async (browser: Browser, groupId: string) =>
  sumTotals(await browser.get<OptionTally[]>(`/api/option-votes/summary?groupId=${groupId}`))

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
    await admin.post('/api/option-votes', { ...qualificationOption(groupId), value: 'true' })
    await member.post('/api/option-votes', { ...qualificationOption(groupId), value: 'false' })

    expect(await admin.delete(`/api/groups/${groupId}/votes`)).toEqual({ cleared: 3, clearedOptions: 2 })
  })

  it("leaves the group with no votes, and other groups' votes alone", async () => {
    const group = await newGroup()
    const other = await newGroup()
    for (const { id: groupId, admin } of [group, other]) {
      await admin.post('/api/votes', { groupId, ruleId: 'IDE0003', vote: 'no' })
      await admin.post('/api/option-votes', { ...qualificationOption(groupId), value: 'true' })
    }

    expect(await group.admin.delete(`/api/groups/${group.id}/votes`)).toEqual({
      cleared: 1,
      clearedOptions: 1,
    })

    expect(await totalVotes(group.admin, group.id)).toBe(0)
    expect(await totalOptionVotes(group.admin, group.id)).toBe(0)
    expect(await totalVotes(other.admin, other.id)).toBe(1)
    expect(await totalOptionVotes(other.admin, other.id)).toBe(1)
  })

  it('keeps every vote when the second delete fails', async () => {
    const { id: groupId, admin } = await newGroup()
    await admin.post('/api/votes', { groupId, ruleId: 'IDE0003', vote: 'no' })
    await admin.post('/api/option-votes', { ...qualificationOption(groupId), value: 'true' })

    await api.db.run(sql`
      CREATE TRIGGER option_votes_undeletable BEFORE DELETE ON option_votes
      BEGIN SELECT RAISE(ABORT, 'option votes cannot be deleted'); END
    `)
    try {
      await expect(admin.delete(`/api/groups/${groupId}/votes`)).rejects.toThrow(/-> 500/)
    } finally {
      await api.db.run(sql`DROP TRIGGER option_votes_undeletable`)
    }

    expect(await totalVotes(admin, groupId)).toBe(1)
    expect(await totalOptionVotes(admin, groupId)).toBe(1)
  })
})
