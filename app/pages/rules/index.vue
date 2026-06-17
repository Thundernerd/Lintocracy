<script setup lang="ts">
import type { Rule } from '#shared/types/rule'

const { data: rules, pending: rulesPending } = await useFetch<Rule[]>('/api/rules')
const { tallies, myVotes, load, hasGroup } = useVoting()
const { activeGroupId, joinedGroups } = useGroup()

const activeGroup = computed(
  () => joinedGroups.value?.find((g) => g.id === activeGroupId.value) ?? null,
)

onMounted(() => load())

const search = ref('')
const category = ref<'all' | 'style' | 'quality'>('all')
const status = ref<'all' | 'voted' | 'unvoted'>('all')

const categoryItems = [
  { label: 'All categories', value: 'all' },
  { label: 'Code style (IDE)', value: 'style' },
  { label: 'Code quality (CA)', value: 'quality' },
]
const statusItems = [
  { label: 'All', value: 'all' },
  { label: 'Voted by me', value: 'voted' },
  { label: 'Not yet voted', value: 'unvoted' },
]

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return (rules.value ?? []).filter((rule) => {
    if (category.value !== 'all' && rule.category !== category.value) return false
    if (status.value === 'voted' && !myVotes.value[rule.id]) return false
    if (status.value === 'unvoted' && myVotes.value[rule.id]) return false
    if (q) {
      const haystack = `${rule.id} ${rule.title} ${rule.summary} ${rule.group}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
})

const votedCount = computed(() => Object.keys(myVotes.value).length)
</script>

<template>
  <UContainer class="py-10">
    <div class="flex flex-col gap-2 mb-6">
      <h1 class="text-3xl font-bold">Rules</h1>
      <p v-if="hasGroup" class="text-muted">
        Voting in <strong>{{ activeGroup?.name ?? 'your group' }}</strong>. Vote
        <strong>Yes</strong> to enable a rule and pick a severity, or <strong>No</strong> to leave
        it off. You've voted on {{ votedCount }} of {{ rules?.length ?? 0 }} rules.
      </p>
      <p v-else class="text-muted">
        Browse all {{ rules?.length ?? 0 }} Microsoft C# rules. Join or create a group to vote.
      </p>
    </div>

    <ClientOnly>
      <UAlert
        v-if="!hasGroup"
        class="mb-6"
        icon="i-lucide-users"
        color="primary"
        variant="subtle"
        title="Voting happens in a group"
        description="Create a group or open an invite link to vote with your team. You can still browse all rules here."
      >
        <template #actions>
          <UButton to="/groups/new" size="xs" color="primary" icon="i-lucide-plus">
            Create a group
          </UButton>
        </template>
      </UAlert>
    </ClientOnly>

    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search rules…"
        class="flex-1"
      />
      <USelect v-model="category" :items="categoryItems" class="w-full sm:w-52" />
      <USelect v-model="status" :items="statusItems" class="w-full sm:w-48" />
    </div>

    <div v-if="rulesPending" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <USkeleton v-for="i in 6" :key="i" class="h-64 w-full" />
    </div>

    <div
      v-else-if="filtered.length"
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <RuleCard
        v-for="rule in filtered"
        :key="rule.id"
        :rule="rule"
        :tally="tallies[rule.id]"
      />
    </div>

    <div v-else class="text-center py-20 text-muted">
      <UIcon name="i-lucide-search-x" class="size-10 mx-auto mb-3" />
      <p>No rules match your filters.</p>
    </div>
  </UContainer>
</template>
