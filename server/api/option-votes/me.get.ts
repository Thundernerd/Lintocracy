import { and, eq } from 'drizzle-orm'
import type { OptionVote } from '#shared/types/rule'
import { useDb } from '../../db'
import { optionVotes } from '../../db/schema'
import { getMemberCookie } from '../../utils/membership'
import { requireGroupFromQuery } from '../../utils/group'

export default defineEventHandler(async (event): Promise<OptionVote[]> => {
  const groupId = await requireGroupFromQuery(event)
  const voterId = getMemberCookie(event, groupId)
  if (!voterId) return []

  const db = useDb()
  const rows = await db
    .select({
      ruleId: optionVotes.ruleId,
      optionName: optionVotes.optionName,
      value: optionVotes.value,
    })
    .from(optionVotes)
    .where(and(eq(optionVotes.groupId, groupId), eq(optionVotes.voterId, voterId)))

  return rows.map((r) => ({ ruleId: r.ruleId, optionName: r.optionName, value: r.value }))
})
