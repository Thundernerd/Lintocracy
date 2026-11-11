<script setup lang="ts">
const route = useRoute()
const groupId = computed(() => String(route.params.groupId))

const { group, members, setActive, refresh, enterAdmin, rename, clearVotes } = useGroup()
const { tallies, load: loadVotes, refreshTallies } = useVoting()
const toast = useToast()

onMounted(async () => {
  setActive(groupId.value)
  await refresh()
  await loadVotes(true)
})

useHead(() => ({ title: group.value ? `${group.value.name} — Lintocracy` : 'Group' }))

const inviteUrl = computed(() => {
  if (!group.value?.inviteToken || !import.meta.client) return ''
  return `${window.location.origin}/join/${group.value.inviteToken}`
})

const totalVotes = computed(() =>
  Object.values(tallies.value).reduce((sum, t) => sum + t.total, 0),
)

async function copyInvite() {
  try {
    await navigator.clipboard.writeText(inviteUrl.value)
    toast.add({ title: 'Invite link copied', color: 'success', icon: 'i-lucide-check' })
  } catch {
    toast.add({ title: 'Could not copy', color: 'error' })
  }
}

// Admin unlock
const password = ref('')
const unlocking = ref(false)
async function unlock() {
  unlocking.value = true
  try {
    await enterAdmin(password.value)
    password.value = ''
    toast.add({ title: 'Admin unlocked', color: 'success', icon: 'i-lucide-shield-check' })
  } catch {
    toast.add({ title: 'Incorrect password', color: 'error', icon: 'i-lucide-x' })
  } finally {
    unlocking.value = false
  }
}

// Rename
const renameOpen = ref(false)
const newName = ref('')
const renaming = ref(false)
function openRename() {
  newName.value = group.value?.name ?? ''
  renameOpen.value = true
}
async function doRename() {
  renaming.value = true
  try {
    await rename(newName.value.trim())
    renameOpen.value = false
    toast.add({ title: 'Group renamed', color: 'success', icon: 'i-lucide-check' })
  } catch {
    toast.add({ title: 'Could not rename', color: 'error', icon: 'i-lucide-x' })
  } finally {
    renaming.value = false
  }
}

// Clear votes
const confirmClear = ref(false)
const clearing = ref(false)
async function doClear() {
  clearing.value = true
  try {
    const { cleared, clearedOptions } = await clearVotes()
    await refreshTallies()
    await loadVotes(true)
    confirmClear.value = false
    toast.add({
      title: `Cleared ${cleared} vote${cleared === 1 ? '' : 's'} and ${clearedOptions} option vote${clearedOptions === 1 ? '' : 's'}`,
      color: 'success',
      icon: 'i-lucide-check',
    })
  } catch {
    toast.add({ title: 'Could not clear votes', color: 'error', icon: 'i-lucide-x' })
  } finally {
    clearing.value = false
  }
}
</script>

<template>
  <UContainer class="py-10 max-w-4xl">
    <div v-if="!group" class="text-center py-20">
      <UIcon name="i-lucide-users" class="size-10 mx-auto mb-3 text-muted" />
      <p class="text-muted">Group not found.</p>
      <UButton to="/" class="mt-4" variant="subtle">Go home</UButton>
    </div>

    <div v-else class="flex flex-col gap-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-users" class="size-6 text-primary" />
            <h1>{{ group.name }}</h1>
            <UBadge v-if="group.isAdmin" color="primary" variant="subtle">Admin</UBadge>
          </div>
          <p class="text-muted">
            {{ group.memberCount }} member{{ group.memberCount === 1 ? '' : 's' }} ·
            {{ totalVotes }} vote{{ totalVotes === 1 ? '' : 's' }} cast
          </p>
        </div>
        <div class="flex items-center gap-2">
          <UButton to="/rules" icon="i-lucide-list-checks">Vote on rules</UButton>
          <UButton to="/results" color="neutral" variant="subtle" icon="i-lucide-bar-chart-3">
            Results
          </UButton>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <UCard>
          <template #header>
            <span class="font-semibold">Members</span>
          </template>
          <ul class="flex flex-col gap-2">
            <li
              v-for="m in members"
              :key="m.id"
              class="flex items-center gap-2 text-sm"
            >
              <UIcon name="i-lucide-user" class="size-4 text-muted" />
              <span>{{ m.name }}</span>
              <UBadge
                v-if="group.me && m.id === group.me.id"
                size="sm"
                variant="subtle"
                color="neutral"
              >
                you
              </UBadge>
            </li>
            <li v-if="!members.length" class="text-sm text-muted">No members yet.</li>
          </ul>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-shield" class="text-primary" />
              <span class="font-semibold">Admin</span>
            </div>
          </template>

          <div v-if="group.isAdmin" class="flex flex-col gap-5">
            <div class="flex flex-col gap-2">
              <span class="text-sm font-medium">Invite link</span>
              <p class="text-xs text-muted">Anyone with this link can join and vote.</p>
              <div class="flex items-center gap-2">
                <UInput :model-value="inviteUrl" readonly class="flex-1" size="sm" />
                <UButton icon="i-lucide-copy" size="sm" color="neutral" @click="copyInvite">
                  Copy
                </UButton>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <UButton size="sm" variant="subtle" color="neutral" icon="i-lucide-pencil" @click="openRename">
                Rename group
              </UButton>
              <UButton
                size="sm"
                color="error"
                variant="subtle"
                icon="i-lucide-trash-2"
                :disabled="totalVotes === 0"
                @click="confirmClear = true"
              >
                Clear all votes
              </UButton>
            </div>
          </div>

          <form v-else class="flex flex-col gap-3" @submit.prevent="unlock">
            <p class="text-sm text-muted">
              Enter the group password to manage this group (invite link, reset votes, rename).
            </p>
            <div class="flex items-center gap-2">
              <UInput
                v-model="password"
                type="password"
                placeholder="Group password"
                class="flex-1"
              />
              <UButton type="submit" icon="i-lucide-unlock" :loading="unlocking">Unlock</UButton>
            </div>
          </form>
        </UCard>
      </div>
    </div>

    <UModal v-model:open="renameOpen" title="Rename group">
      <template #body>
        <UInput v-model="newName" placeholder="Group name" class="w-full" />
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="renameOpen = false">Cancel</UButton>
          <UButton :loading="renaming" icon="i-lucide-check" @click="doRename">Save</UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="confirmClear" title="Clear all votes?">
      <template #body>
        <p class="text-muted">
          This permanently deletes all <strong>{{ totalVotes }}</strong> votes for this group. This
          cannot be undone.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="confirmClear = false">Cancel</UButton>
          <UButton color="error" icon="i-lucide-trash-2" :loading="clearing" @click="doClear">
            Yes, clear everything
          </UButton>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
