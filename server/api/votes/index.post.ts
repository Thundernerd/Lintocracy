import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { useDb } from '../../db'
import { votes } from '../../db/schema'
import { getMemberId } from '../../utils/membership'
import { assertGroupExists } from '../../utils/group'
import { rules } from '../../data/rules'

const bodySchema = z
  .object({
    groupId: z.string(),
    ruleId: z.string(),
    vote: z.enum(['yes', 'no']),
    severity: z.enum(['none', 'suggestion', 'warning', 'error']).nullable().optional(),
  })
  .refine((b) => b.vote === 'no' || (b.severity && b.severity !== 'none'), {
    message: 'A "yes" vote must include a severity of suggestion, warning, or error.',
    path: ['severity'],
  })

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid vote',
      message: z.prettifyError(parsed.error),
    })
  }

  const { groupId, ruleId, vote } = parsed.data
  if (!rules.some((r) => r.id === ruleId)) {
    throw createError({ statusCode: 404, statusMessage: `Unknown rule: ${ruleId}` })
  }

  await assertGroupExists(groupId)
  const voterId = await getMemberId(event, groupId)

  const severity = vote === 'yes' ? parsed.data.severity! : null
  const db = await useDb()
  const now = Date.now()

  const existing = await db
    .select()
    .from(votes)
    .where(and(eq(votes.groupId, groupId), eq(votes.ruleId, ruleId), eq(votes.voterId, voterId)))
    .limit(1)

  if (existing.length) {
    await db
      .update(votes)
      .set({ vote, severity, updatedAt: now })
      .where(eq(votes.id, existing[0]!.id))
  } else {
    await db
      .insert(votes)
      .values({ groupId, ruleId, voterId, vote, severity, createdAt: now, updatedAt: now })
  }

  return { ruleId, vote, severity } satisfies {
    ruleId: string
    vote: 'yes' | 'no'
    severity: typeof severity
  }
})
