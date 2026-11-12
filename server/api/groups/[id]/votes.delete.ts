import { eq } from 'drizzle-orm'
import { useDb } from '../../../db'
import { votes, optionVotes } from '../../../db/schema'
import { requireAdmin } from '../../../utils/groupAdmin'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  requireAdmin(event, id)

  const db = await useDb()

  // A batch runs as one transaction, so both deletes happen or neither does, and the counts
  // are the rows actually deleted (a vote cast mid-request is either cleared and counted, or
  // kept). Unlike `db.transaction`, it stays on the client's connection instead of handing
  // that connection to the transaction and opening a new one.
  const [deletedVotes, deletedOptionVotes] = await db.batch([
    db.delete(votes).where(eq(votes.groupId, id)).returning({ id: votes.id }),
    db.delete(optionVotes).where(eq(optionVotes.groupId, id)).returning({ id: optionVotes.id }),
  ])

  return { cleared: deletedVotes.length, clearedOptions: deletedOptionVotes.length }
})
