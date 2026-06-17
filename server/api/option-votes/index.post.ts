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
  value: z.string(),
})

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid option vote',
      message: z.prettifyError(parsed.error),
    })
  }

  const { groupId, ruleId, optionName, value } = parsed.data
  const rule = rules.find((r) => r.id === ruleId)
  const option = rule?.options?.find((o) => o.name === optionName)
  if (!option) {
    throw createError({
      statusCode: 404,
      statusMessage: `Unknown option: ${ruleId}.${optionName}`,
    })
  }
  // Only accept documented values when the option enumerates them.
  if (option.values?.length && !option.values.some((v) => v.value === value)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid value for ${optionName}: ${value}`,
    })
  }

  await assertGroupExists(groupId)
  const voterId = await getMemberId(event, groupId)
  const db = useDb()
  const now = Date.now()

  const existing = await db
    .select()
    .from(optionVotes)
    .where(
      and(
        eq(optionVotes.groupId, groupId),
        eq(optionVotes.ruleId, ruleId),
        eq(optionVotes.optionName, optionName),
        eq(optionVotes.voterId, voterId),
      ),
    )
    .limit(1)

  if (existing.length) {
    await db
      .update(optionVotes)
      .set({ value, updatedAt: now })
      .where(eq(optionVotes.id, existing[0]!.id))
  } else {
    await db
      .insert(optionVotes)
      .values({ groupId, ruleId, optionName, voterId, value, createdAt: now, updatedAt: now })
  }

  return { ruleId, optionName, value }
})
