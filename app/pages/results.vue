<script setup lang="ts">
import type { Rule, RuleTally } from '#shared/types/rule'
import {
  deriveConsensus,
  type SeverityTieBreak,
  type YesNoTieBreak,
} from '#shared/utils/consensus'
import { generateEditorConfig } from '#shared/utils/editorconfig'

const { data: rules } = await useFetch<Rule[]>('/api/rules')
const { tallies, optionTallies, load, hasGroup } = useVoting()
const { activeGroupId, joinedGroups } = useGroup()
const toast = useToast()

const activeGroup = computed(
  () => joinedGroups.value?.find((g) => g.id === activeGroupId.value) ?? null,
)

onMounted(() => load())

const includeUnvoted = ref(false)
const useMsDefaults = ref(false)

// The two fallback modes are mutually exclusive.
watch(useMsDefaults, (on) => {
  if (on) includeUnvoted.value = false
})
watch(includeUnvoted, (on) => {
  if (on) useMsDefaults.value = false
})

// Tie-breaking options that re-resolve the consensus client-side.
const yesNoTie = ref<YesNoTieBreak>('exclude')
const severityTie = ref<SeverityTieBreak>('highest')

const yesNoTieItems = [
  { label: 'Exclude (leave the rule off)', value: 'exclude' },
  { label: 'Include (enable the rule)', value: 'include' },
]
const severityTieItems = [
  { label: 'Highest selected (strictest)', value: 'highest' },
  { label: 'Lowest selected (most lenient)', value: 'lowest' },
]

// Re-derive each tally's consensus using the selected tie-breaking options.
const effectiveTallies = computed<RuleTally[]>(() =>
  Object.values(tallies.value).map((t) => ({
    ...t,
    ...deriveConsensus(t.yes, t.no, t.severityBreakdown, {
      yesNoTie: yesNoTie.value,
      severityTie: severityTie.value,
    }),
  })),
)

const effectiveById = computed(() => new Map(effectiveTallies.value.map((t) => [t.ruleId, t])))

const stats = computed(() => {
  const list = effectiveTallies.value
  const enabled = list.filter((t) => t.consensusEnabled).length
  const votes = list.reduce((sum, t) => sum + t.total, 0)
  return {
    rules: rules.value?.length ?? 0,
    enabled,
    votes,
  }
})

const editorConfig = computed(() => {
  if (!rules.value) return ''
  return generateEditorConfig(rules.value, effectiveTallies.value, {
    includeUnvoted: includeUnvoted.value,
    useMsDefaults: useMsDefaults.value,
    optionTallies: Object.values(optionTallies.value),
  })
})

const consensusRows = computed(() => {
  return (rules.value ?? [])
    .map((rule) => ({ rule, tally: effectiveById.value.get(rule.id) }))
    .filter(({ tally }) => tally && tally.total > 0)
    .sort((a, b) => (b.tally?.total ?? 0) - (a.tally?.total ?? 0))
})

async function copyConfig() {
  try {
    await navigator.clipboard.writeText(editorConfig.value)
    toast.add({ title: 'Copied .editorconfig to clipboard', color: 'success', icon: 'i-lucide-check' })
  } catch {
    toast.add({ title: 'Could not copy', color: 'error' })
  }
}

function downloadConfig() {
  const blob = new Blob([editorConfig.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '.editorconfig'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <UContainer class="py-10">
    <h1 class="text-3xl font-bold mb-2">
      {{ hasGroup && activeGroup ? `${activeGroup.name} results` : 'Results' }}
    </h1>

    <ClientOnly>
      <UAlert
        v-if="!hasGroup"
        class="mb-6"
        icon="i-lucide-users"
        color="primary"
        variant="subtle"
        title="No active group"
        description="Results and the generated .editorconfig are scoped to a group. Create one or open an invite link to get started."
      >
        <template #actions>
          <UButton to="/groups/new" size="xs" color="primary" icon="i-lucide-plus">
            Create a group
          </UButton>
        </template>
      </UAlert>
    </ClientOnly>

    <p class="text-muted mb-6">
      The consensus across your group's votes, ready to export as an
      <code class="text-primary">.editorconfig</code>.
    </p>

    <div class="grid gap-4 sm:grid-cols-3 mb-8">
      <UCard>
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-list-checks" class="size-8 text-primary" />
          <div>
            <div class="text-2xl font-bold">{{ stats.rules }}</div>
            <div class="text-sm text-muted">rules</div>
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-check-check" class="size-8 text-primary" />
          <div>
            <div class="text-2xl font-bold">{{ stats.enabled }}</div>
            <div class="text-sm text-muted">enabled by consensus</div>
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-vote" class="size-8 text-primary" />
          <div>
            <div class="text-2xl font-bold">{{ stats.votes }}</div>
            <div class="text-sm text-muted">votes cast</div>
          </div>
        </div>
      </UCard>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <span class="font-semibold">.editorconfig</span>
            <div class="flex items-center gap-2">
              <UButton size="xs" color="neutral" variant="subtle" icon="i-lucide-copy" @click="copyConfig">
                Copy
              </UButton>
              <UButton size="xs" icon="i-lucide-download" @click="downloadConfig">
                Download
              </UButton>
            </div>
          </div>
        </template>

        <div class="flex flex-col gap-3">
          <USwitch
            v-model="useMsDefaults"
            label="Use Microsoft defaults for unvoted rules & options"
            description="Falls back to the documented default severity and option values where there are no votes."
          />
          <USwitch
            v-model="includeUnvoted"
            label="Include rules with no votes (as none)"
          />

          <div class="grid gap-3 sm:grid-cols-2 pt-1">
            <UFormField
              label="On a Yes/No tie"
              help="When a rule has equal yes and no votes."
            >
              <USelect v-model="yesNoTie" :items="yesNoTieItems" class="w-full" />
            </UFormField>
            <UFormField
              label="On a severity tie"
              help="When no single severity has the most votes."
            >
              <USelect v-model="severityTie" :items="severityTieItems" class="w-full" />
            </UFormField>
          </div>

          <CodeBlock :code="editorConfig" lang="ini" />
        </div>
      </UCard>

      <UCard>
        <template #header>
          <span class="font-semibold">Consensus by rule</span>
        </template>

        <div v-if="consensusRows.length" class="flex flex-col divide-y divide-default">
          <div
            v-for="{ rule, tally } in consensusRows"
            :key="rule.id"
            class="flex items-center justify-between gap-3 py-3"
          >
            <NuxtLink :to="`/rules/${rule.id}`" class="min-w-0 group">
              <div class="flex items-center gap-2">
                <UBadge size="sm" variant="subtle" :color="rule.category === 'style' ? 'info' : 'secondary'">
                  {{ rule.id }}
                </UBadge>
                <span class="truncate group-hover:text-primary transition-colors">{{ rule.title }}</span>
              </div>
            </NuxtLink>
            <div class="flex items-center gap-3 shrink-0">
              <span class="text-xs text-muted">{{ tally?.yes }}–{{ tally?.no }}</span>
              <SeverityBadge :severity="tally?.consensusSeverity ?? 'none'" />
            </div>
          </div>
        </div>

        <div v-else class="text-center py-10 text-muted">
          <UIcon name="i-lucide-inbox" class="size-8 mx-auto mb-2" />
          <p>No votes yet. Be the first to <NuxtLink to="/rules" class="text-primary">vote on rules</NuxtLink>.</p>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>
