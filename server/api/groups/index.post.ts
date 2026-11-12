import { z } from 'zod'
import { useDb } from '../../db'
import { groups, members } from '../../db/schema'
import { hashPassword } from '../../utils/password'
import { newGroupId, newMemberId, newInviteToken } from '../../utils/ids'
import { setMembership } from '../../utils/membership'
import { grantAdmin } from '../../utils/groupAdmin'

const bodySchema = z.object({
  name: z.string().trim().min(1, 'Group name is required').max(80),
  displayName: z.string().trim().min(1, 'Your name is required').max(60),
  password: z.string().min(4, 'Password must be at least 4 characters').max(200),
})

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid group',
      message: z.prettifyError(parsed.error),
    })
  }

  const { name, displayName, password } = parsed.data
  const db = await useDb()
  const now = Date.now()

  const id = newGroupId()
  const inviteToken = newInviteToken()
  const memberId = newMemberId()

  await db.insert(groups).values({
    id,
    name,
    passwordHash: hashPassword(password),
    inviteToken,
    createdAt: now,
  })
  await db.insert(members).values({ id: memberId, groupId: id, name: displayName, createdAt: now })

  setMembership(event, id, memberId)
  grantAdmin(event, id)

  return { id, inviteToken }
})
