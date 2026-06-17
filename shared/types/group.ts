export interface GroupSummary {
  id: string
  name: string
  memberCount: number
}

/** Group context for the current browser, returned by `GET /api/groups/:id`. */
export interface GroupContext {
  id: string
  name: string
  memberCount: number
  /** The current browser's member info, when joined. */
  me: { id: string; name: string } | null
  isAdmin: boolean
  /** Only present for admins. */
  inviteToken?: string
}

export interface GroupMember {
  id: string
  name: string
  createdAt: number
}
