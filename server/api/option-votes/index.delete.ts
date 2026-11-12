import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { useDb } from '../../db'
import { optionVotes } from '../../db/schema'
import { getMemberId } from '../../utils/membership'
import { assertGroupExists } from '../../utils/group'
import { rules } from '../../data/rules'

const bodySchema = z.object({
  groupId: z.string(),
  ruleId: z.string(),
  optionName: z.string(),
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

  const { groupId, ruleId, optionName } = parsed.data
  const rule = rules.find((r) => r.id === ruleId)
  const option = rule?.options?.find((o) => o.name === optionName)
  if (!option) {
    throw createError({
      statusCode: 404,
      statusMessage: `Unknown option: ${ruleId}.${optionName}`,
    })
  }

  await assertGroupExists(groupId)
  const voterId = await getMemberId(event, groupId)
  const db = await useDb()

  await db
    .delete(optionVotes)
    .where(
      and(
        eq(optionVotes.groupId, groupId),
        eq(optionVotes.ruleId, ruleId),
        eq(optionVotes.optionName, optionName),
        eq(optionVotes.voterId, voterId),
      ),
    )

  return { ruleId, optionName, removed: true }
})
