import { eq } from 'drizzle-orm'
import { useDb } from '../../../db'
import { votes, optionVotes } from '../../../db/schema'
import { requireAdmin } from '../../../utils/groupAdmin'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  requireAdmin(event, id)

  // One transaction, so both deletes happen or neither does, and the counts are the rows
  // actually deleted (a vote cast mid-request is either cleared and counted, or kept).
  const { cleared, clearedOptions } = await useDb().transaction(async (tx) => {
    const deletedVotes = await tx
      .delete(votes)
      .where(eq(votes.groupId, id))
      .returning({ id: votes.id })
    const deletedOptionVotes = await tx
      .delete(optionVotes)
      .where(eq(optionVotes.groupId, id))
      .returning({ id: optionVotes.id })
    return { cleared: deletedVotes.length, clearedOptions: deletedOptionVotes.length }
  })

  return { cleared, clearedOptions }
})
