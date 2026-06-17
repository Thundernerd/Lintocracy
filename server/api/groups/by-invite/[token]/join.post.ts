import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { useDb } from '../../../../db'
import { groups, members } from '../../../../db/schema'
import { newMemberId } from '../../../../utils/ids'
import { setMembership, getMemberCookie } from '../../../../utils/membership'

const bodySchema = z.object({
  name: z.string().trim().min(1, 'Your name is required').max(60),
})

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')!

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid name',
      message: z.prettifyError(parsed.error),
    })
  }

  const db = useDb()
  const [group] = await db
    .select({ id: groups.id, name: groups.name })
    .from(groups)
    .where(eq(groups.inviteToken, token))
    .limit(1)
  if (!group) {
    throw createError({ statusCode: 404, statusMessage: 'Invite not found' })
  }

  // Reuse an existing membership for this browser if present.
  const existing = getMemberCookie(event, group.id)
  if (existing) {
    const [row] = await db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.id, existing))
      .limit(1)
    if (row) {
      setMembership(event, group.id, existing)
      return { id: group.id, name: group.name, memberId: existing }
    }
  }

  const memberId = newMemberId()
  await db
    .insert(members)
    .values({ id: memberId, groupId: group.id, name: parsed.data.name, createdAt: Date.now() })

  setMembership(event, group.id, memberId)
  return { id: group.id, name: group.name, memberId }
})
