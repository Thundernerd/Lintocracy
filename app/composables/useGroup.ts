import type { GroupContext, GroupMember } from '#shared/types/group'

interface JoinedGroup {
  id: string
  name: string
}

/**
 * Active-group context for the current browser. The active group id lives in a
 * cookie; `cv_groups` remembers every group this browser has joined so we can
 * offer a switcher.
 */
export function useGroup() {
  const activeGroupId = useCookie<string | null>('cv_active_group', {
    default: () => null,
    watch: true,
    sameSite: 'lax',
  })
  const joinedGroups = useCookie<JoinedGroup[]>('cv_groups', {
    default: () => [],
    watch: true,
    sameSite: 'lax',
  })

  const group = useState<GroupContext | null>('cv-group', () => null)
  const members = useState<GroupMember[]>('cv-group-members', () => [])
  const pending = useState<boolean>('cv-group-pending', () => false)

  function remember(id: string, name: string) {
    const list = [...(joinedGroups.value ?? [])]
    const idx = list.findIndex((g) => g.id === id)
    if (idx >= 0) list[idx] = { id, name }
    else list.push({ id, name })
    joinedGroups.value = list
  }

  async function refresh() {
    const id = activeGroupId.value
    if (!id) {
      group.value = null
      members.value = []
      return
    }
    pending.value = true
    try {
      const [ctx, roster] = await Promise.all([
        $fetch<GroupContext>(`/api/groups/${id}`),
        $fetch<GroupMember[]>(`/api/groups/${id}/members`),
      ])
      group.value = ctx
      members.value = roster
      remember(ctx.id, ctx.name)
    } catch {
      // Group no longer exists or is inaccessible from this browser.
      group.value = null
      members.value = []
    } finally {
      pending.value = false
    }
  }

  async function createGroup(payload: { name: string; displayName: string; password: string }) {
    const res = await $fetch<{ id: string; inviteToken: string }>('/api/groups', {
      method: 'POST',
      body: payload,
    })
    activeGroupId.value = res.id
    remember(res.id, payload.name)
    await refresh()
    return res
  }

  async function joinByToken(token: string, name: string) {
    const res = await $fetch<{ id: string; name: string; memberId: string }>(
      `/api/groups/by-invite/${token}/join`,
      { method: 'POST', body: { name } },
    )
    activeGroupId.value = res.id
    remember(res.id, res.name)
    await refresh()
    return res
  }

  async function enterAdmin(password: string) {
    if (!activeGroupId.value) return
    await $fetch(`/api/groups/${activeGroupId.value}/admin`, {
      method: 'POST',
      body: { password },
    })
    await refresh()
  }

  async function rename(name: string) {
    if (!activeGroupId.value) return
    await $fetch(`/api/groups/${activeGroupId.value}`, { method: 'PATCH', body: { name } })
    await refresh()
  }

  async function clearVotes() {
    if (!activeGroupId.value) throw new Error('No active group')
    return await $fetch<{ cleared: number; clearedOptions: number }>(
      `/api/groups/${activeGroupId.value}/votes`,
      { method: 'DELETE' },
    )
  }

  function setActive(id: string) {
    activeGroupId.value = id
  }

  return {
    activeGroupId,
    joinedGroups,
    group,
    members,
    pending,
    refresh,
    createGroup,
    joinByToken,
    enterAdmin,
    rename,
    clearVotes,
    setActive,
  }
}
