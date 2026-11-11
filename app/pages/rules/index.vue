<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui'
import type { Rule, RuleCategory } from '#shared/types/rule'

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
const layout = ref<'flat' | 'grouped'>('flat')
const openGroups = ref<string[]>([])

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
const layoutItems = [
  { label: 'All rules', value: 'flat' },
  { label: 'By group', value: 'grouped' },
]

const CATEGORY_ORDER: Record<RuleCategory, number> = { style: 0, quality: 1 }

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

interface RuleGroup {
  name: string
  category: RuleCategory
  rules: Rule[]
  count: number
}

const grouped = computed<RuleGroup[]>(() => {
  const map = new Map<string, Rule[]>()
  for (const rule of filtered.value) {
    const list = map.get(rule.group) ?? []
    list.push(rule)
    map.set(rule.group, list)
  }

  return [...map.entries()]
    .map(([name, groupRules]) => ({
      name,
      category: groupRules[0]!.category,
      rules: [...groupRules].sort((a, b) => a.id.localeCompare(b.id)),
      count: groupRules.length,
    }))
    .sort((a, b) => {
      if (a.category !== b.category) return CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category]
      return a.name.localeCompare(b.name)
    })
})

type RuleGroupAccordionItem = AccordionItem & RuleGroup

const accordionItems = computed<RuleGroupAccordionItem[]>(() =>
  grouped.value.map((group) => ({
    ...group,
    value: group.name,
    label: `${group.name} (${group.count})`,
    icon: group.category === 'style' ? 'i-lucide-brush' : 'i-lucide-shield-check',
  })),
)

watch([search, grouped, layout], ([query, groups, mode]) => {
  if (mode !== 'grouped') return
  if (query.trim()) {
    openGroups.value = groups.map((group) => group.name)
    return
  }
  openGroups.value = openGroups.value.filter((name) => groups.some((group) => group.name === name))
})

function expandAllGroups() {
  openGroups.value = grouped.value.map((group) => group.name)
}

function collapseAllGroups() {
  openGroups.value = []
}

const votedCount = computed(() => Object.keys(myVotes.value).length)
</script>

<template>
  <UContainer class="py-10">
    <div class="flex flex-col gap-2 mb-6">
      <h1 class="text-3xl">Rules</h1>
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
      <USelect v-model="layout" :items="layoutItems" class="w-full sm:w-40" />
      <USelect v-model="category" :items="categoryItems" class="w-full sm:w-52" />
      <USelect v-model="status" :items="statusItems" class="w-full sm:w-48" />
    </div>

    <div
      v-if="!rulesPending && filtered.length"
      class="flex items-center justify-between gap-3 mb-4"
    >
      <p class="text-sm text-muted">
        <template v-if="layout === 'grouped'">
          {{ filtered.length }} rule{{ filtered.length === 1 ? '' : 's' }} in
          {{ grouped.length }} group{{ grouped.length === 1 ? '' : 's' }}
        </template>
        <template v-else>
          {{ filtered.length }} rule{{ filtered.length === 1 ? '' : 's' }}
        </template>
      </p>
      <div v-if="layout === 'grouped'" class="flex items-center gap-2">
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-chevrons-down-up"
          @click="expandAllGroups"
        >
          Expand all
        </UButton>
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-chevrons-up-down"
          @click="collapseAllGroups"
        >
          Collapse all
        </UButton>
      </div>
    </div>

    <div v-if="rulesPending" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <USkeleton v-for="i in 6" :key="i" class="h-64 w-full" />
    </div>

    <div
      v-else-if="filtered.length && layout === 'flat'"
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <RuleCard
        v-for="rule in filtered"
        :key="rule.id"
        :rule="rule"
        :tally="tallies[rule.id]"
      />
    </div>

    <UAccordion
      v-else-if="filtered.length && layout === 'grouped'"
      v-model="openGroups"
      type="multiple"
      :items="accordionItems"
      :ui="{ trigger: 'text-base', body: 'pb-6' }"
    >
      <template #body="{ item }">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <RuleCard
            v-for="rule in item.rules"
            :key="rule.id"
            :rule="rule"
            :tally="tallies[rule.id]"
            hide-group
          />
        </div>
      </template>
    </UAccordion>

    <div v-else class="text-center py-20 text-muted">
      <UIcon name="i-lucide-search-x" class="size-10 mx-auto mb-3" />
      <p>No rules match your filters.</p>
    </div>
  </UContainer>
</template>
