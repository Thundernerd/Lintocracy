<script setup lang="ts">
import type { GroupSummary } from '#shared/types/group'

const route = useRoute()
const token = computed(() => String(route.params.token))

const { joinByToken } = useGroup()
const toast = useToast()
const router = useRouter()

const { data: group, error } = await useFetch<GroupSummary>(
  `/api/groups/by-invite/${token.value}`,
)

useHead(() => ({ title: group.value ? `Join ${group.value.name} — Lintocracy` : 'Join a group' }))

const name = ref('')
const busy = ref(false)

async function submit() {
  if (!name.value.trim()) {
    toast.add({ title: 'Enter your name', color: 'warning', icon: 'i-lucide-triangle-alert' })
    return
  }
  busy.value = true
  try {
    const res = await joinByToken(token.value, name.value.trim())
    toast.add({ title: `Joined ${res.name}`, color: 'success', icon: 'i-lucide-check' })
    router.push('/rules')
  } catch {
    toast.add({ title: 'Could not join the group', color: 'error', icon: 'i-lucide-x' })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <UContainer class="py-12 max-w-lg">
    <div v-if="error" class="text-center py-20">
      <UIcon name="i-lucide-link-2-off" class="size-10 mx-auto mb-3 text-muted" />
      <p class="text-muted">This invite link is invalid or has expired.</p>
      <UButton to="/" class="mt-4" variant="subtle">Go home</UButton>
    </div>

    <template v-else-if="group">
      <div class="flex items-center gap-2 mb-2">
        <UIcon name="i-lucide-user-plus" class="size-6 text-primary" />
        <h1>Join {{ group.name }}</h1>
      </div>
      <p class="text-muted mb-8">
        {{ group.memberCount }} member{{ group.memberCount === 1 ? '' : 's' }} so far. Enter your
        name to join and vote with the team.
      </p>

      <UCard>
        <form class="flex flex-col gap-5" @submit.prevent="submit">
          <UFormField label="Your name" required>
            <UInput v-model="name" placeholder="e.g. Sam" size="lg" class="w-full" autofocus />
          </UFormField>
          <UButton type="submit" size="lg" icon="i-lucide-user-plus" :loading="busy" block>
            Join group
          </UButton>
        </form>
      </UCard>
    </template>
  </UContainer>
</template>
