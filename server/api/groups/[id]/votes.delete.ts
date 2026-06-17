import { eq, sql } from 'drizzle-orm'
import { useDb } from '../../../db'
import { votes, optionVotes } from '../../../db/schema'
import { requireAdmin } from '../../../utils/groupAdmin'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  requireAdmin(event, id)

  const db = useDb()

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(votes)
    .where(eq(votes.groupId, id))
  const [{ count: optionCount }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(optionVotes)
    .where(eq(optionVotes.groupId, id))

  await db.delete(votes).where(eq(votes.groupId, id))
  await db.delete(optionVotes).where(eq(optionVotes.groupId, id))

  return { cleared: Number(count), clearedOptions: Number(optionCount) }
})
