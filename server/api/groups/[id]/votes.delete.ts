import { eq } from 'drizzle-orm'
import { useDb } from '../../../db'
import { votes, optionVotes } from '../../../db/schema'
import { requireAdmin } from '../../../utils/groupAdmin'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  requireAdmin(event, id)

  const db = useDb()

  const cleared = await db.$count(votes, eq(votes.groupId, id))
  const clearedOptions = await db.$count(optionVotes, eq(optionVotes.groupId, id))

  await db.delete(votes).where(eq(votes.groupId, id))
  await db.delete(optionVotes).where(eq(optionVotes.groupId, id))

  return { cleared, clearedOptions }
})
