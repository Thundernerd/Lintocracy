import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { useDb } from '../../db'
import { votes } from '../../db/schema'
import { getMemberId } from '../../utils/membership'
import { assertGroupExists } from '../../utils/group'
import { rules } from '../../data/rules'

const bodySchema = z.object({
  groupId: z.string(),
  ruleId: z.string(),
})

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request',
      message: z.prettifyError(parsed.error),
    })
  }

  const { groupId, ruleId } = parsed.data
  if (!rules.some((r) => r.id === ruleId)) {
    throw createError({ statusCode: 404, statusMessage: `Unknown rule: ${ruleId}` })
  }

  await assertGroupExists(groupId)
  const voterId = await getMemberId(event, groupId)
  const db = await useDb()

  await db
    .delete(votes)
    .where(and(eq(votes.groupId, groupId), eq(votes.ruleId, ruleId), eq(votes.voterId, voterId)))

  return { ruleId, removed: true }
})
