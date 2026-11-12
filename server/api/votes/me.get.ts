import { and, eq } from 'drizzle-orm'
import type { MyVote } from '#shared/types/rule'
import { useDb } from '../../db'
import { votes } from '../../db/schema'
import { getMemberCookie } from '../../utils/membership'
import { requireGroupFromQuery } from '../../utils/group'

export default defineEventHandler(async (event): Promise<MyVote[]> => {
  const groupId = await requireGroupFromQuery(event)
  const voterId = getMemberCookie(event, groupId)
  if (!voterId) return []

  const db = await useDb()
  const rows = await db
    .select({ ruleId: votes.ruleId, vote: votes.vote, severity: votes.severity })
    .from(votes)
    .where(and(eq(votes.groupId, groupId), eq(votes.voterId, voterId)))

  return rows.map((r) => ({ ruleId: r.ruleId, vote: r.vote, severity: r.severity }))
})
