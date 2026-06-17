import { randomBytes, randomUUID } from 'node:crypto'

/** Short url-safe id for groups (used in URLs). */
export const newGroupId = () => randomBytes(8).toString('hex')

/** Opaque member id, also used as the per-group voter id. */
export const newMemberId = () => randomUUID()

/** Long random invite token for shareable join links. */
export const newInviteToken = () => randomBytes(18).toString('base64url')
