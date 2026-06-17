<script setup lang="ts">
import type { Rule, Severity } from '#shared/types/rule'

const route = useRoute()
const id = computed(() => String(route.params.id))

const { data: rule, error } = await useFetch<Rule>(`/api/rules/${id.value}`)
const { data: allRules } = await useFetch<Rule[]>('/api/rules', { key: 'rules-list' })
const { tallies, load } = useVoting()

const relatedRules = computed(() => {
  if (!rule.value?.related?.length || !allRules.value) return []
  const byId = new Map(allRules.value.map((r) => [r.id, r]))
  return rule.value.related.map((rid) => byId.get(rid)).filter((r): r is Rule => Boolean(r))
})

onMounted(() => load())

const tally = computed(() => tallies.value[id.value])

const severityRows = computed(() => {
  const b = tally.value?.severityBreakdown
  return (['suggestion', 'warning', 'error'] as Severity[]).map((sev) => ({
    severity: sev,
    count: b?.[sev] ?? 0,
  }))
})

useHead(() => ({ title: rule.value ? `${rule.value.id} — ${rule.value.title}` : 'Rule' }))
</script>

<template>
  <UContainer class="py-10 max-w-6xl">
    <div v-if="error" class="text-center py-20">
      <UIcon name="i-lucide-file-x" class="size-10 mx-auto mb-3 text-muted" />
      <p class="text-muted">Rule not found.</p>
      <UButton to="/rules" class="mt-4" variant="subtle">Back to rules</UButton>
    </div>

    <div v-else-if="rule" class="flex flex-col gap-8">
      <div class="flex flex-col gap-3">
        <UButton
          to="/rules"
          variant="link"
          color="neutral"
          icon="i-lucide-arrow-left"
          class="self-start -ml-2"
        >
          All rules
        </UButton>
        <div class="flex flex-wrap items-center gap-2">
          <UBadge :color="rule.category === 'style' ? 'info' : 'secondary'" variant="subtle">
            {{ rule.id }}
          </UBadge>
          <span class="text-sm text-muted">{{ rule.group }}</span>
          <UBadge v-if="rule.enabledByDefault" color="neutral" variant="outline">
            Enabled by default: {{ rule.enabledByDefault }}
          </UBadge>
          <UBadge v-if="rule.curated" color="neutral" variant="outline">
            MS default: {{ severityLabel[rule.defaultSeverity] }}
          </UBadge>
        </div>
        <h1 class="text-3xl font-bold">{{ rule.title }}</h1>
        <p class="text-lg text-muted">{{ rule.summary }}</p>
        <UButton
          :to="rule.docsUrl"
          target="_blank"
          variant="subtle"
          color="neutral"
          icon="i-lucide-external-link"
          class="self-start"
        >
          Microsoft docs
        </UButton>

        <div
          v-if="relatedRules.length"
          class="flex flex-wrap items-center gap-2 rounded-lg border border-default bg-elevated/40 p-3"
        >
          <span class="inline-flex items-center gap-1.5 text-sm text-muted">
            <UIcon name="i-lucide-link" class="size-4" />
            Documented together with
          </span>
          <UButton
            v-for="rel in relatedRules"
            :key="rel.id"
            :to="`/rules/${rel.id}`"
            size="xs"
            color="neutral"
            variant="subtle"
          >
            <UBadge
              size="sm"
              variant="subtle"
              :color="rel.category === 'style' ? 'info' : 'secondary'"
            >
              {{ rel.id }}
            </UBadge>
            <span class="truncate max-w-50">{{ rel.title }}</span>
          </UButton>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2 min-w-0 flex flex-col gap-6">
          <section v-if="rule.description">
            <h2 class="font-semibold text-lg mb-2">Description</h2>
            <RuleProse :text="rule.description" />
          </section>

          <section v-if="rule.cause">
            <h2 class="font-semibold text-lg mb-2">Cause</h2>
            <RuleProse :text="rule.cause" />
          </section>

          <section v-if="rule.whyItMatters">
            <h2 class="font-semibold text-lg mb-2">Why it matters</h2>
            <RuleProse :text="rule.whyItMatters" />
          </section>

          <section v-if="rule.howToFix">
            <h2 class="font-semibold text-lg mb-2">How to fix violations</h2>
            <RuleProse :text="rule.howToFix" />
          </section>

          <section v-if="rule.examples?.bad || rule.examples?.good" class="flex flex-col gap-4">
            <h2 class="font-semibold text-lg">Examples</h2>
            <div v-if="rule.examples?.bad">
              <div class="flex items-center gap-2 text-sm text-error mb-1">
                <UIcon name="i-lucide-x-circle" /> Avoid
              </div>
              <CodeBlock :code="rule.examples.bad" />
            </div>
            <div v-if="rule.examples?.good">
              <div class="flex items-center gap-2 text-sm text-success mb-1">
                <UIcon name="i-lucide-check-circle" /> Prefer
              </div>
              <CodeBlock :code="rule.examples.good" />
            </div>
          </section>

          <section v-else-if="rule.example" class="flex flex-col gap-2">
            <h2 class="font-semibold text-lg">Example</h2>
            <CodeBlock :code="rule.example" />
          </section>

          <section v-if="rule.options?.length" class="flex flex-col gap-4">
            <div>
              <h2 class="font-semibold text-lg">Configurable options</h2>
              <p class="text-sm text-muted">
                Vote for the value each option should take in the generated
                <code class="text-primary">.editorconfig</code>.
              </p>
            </div>
            <OptionVoteControl
              v-for="opt in rule.options"
              :key="opt.name"
              :rule-id="rule.id"
              :option="opt"
            />
          </section>

          <section v-if="rule.whenToSuppress">
            <h2 class="font-semibold text-lg mb-2">When to suppress</h2>
            <RuleProse :text="rule.whenToSuppress" />
          </section>

          <UAlert
            v-if="!rule.description && !rule.cause && !rule.example && !rule.examples"
            icon="i-lucide-book-open"
            color="neutral"
            variant="soft"
            title="More details on Microsoft Learn"
            description="See the official Microsoft docs for full guidance, configurable options, and examples."
          >
            <template #actions>
              <UButton
                :to="rule.docsUrl"
                target="_blank"
                size="xs"
                color="neutral"
                variant="subtle"
                icon="i-lucide-external-link"
                label="Open docs"
              />
            </template>
          </UAlert>
        </div>

        <div class="flex flex-col gap-6">
          <UCard>
            <template #header>
              <span class="font-semibold">Your vote</span>
            </template>
            <VoteControl :rule-id="rule.id" :default-severity="rule.defaultSeverity" />
          </UCard>

          <UCard>
            <template #header>
              <span class="font-semibold">Group results</span>
            </template>
            <div class="flex flex-col gap-4">
              <TallyBar :tally="tally" />
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted">Consensus</span>
                <SeverityBadge :severity="tally?.consensusSeverity ?? 'none'" />
              </div>
              <div class="flex flex-col gap-2">
                <span class="text-xs text-muted">Severity preference (yes voters)</span>
                <div
                  v-for="row in severityRows"
                  :key="row.severity"
                  class="flex items-center justify-between text-sm"
                >
                  <span class="inline-flex items-center gap-1.5">
                    <UIcon
                      :name="severityIcon[row.severity]"
                      :class="severityTextClass[row.severity]"
                    />
                    {{ severityLabel[row.severity] }}
                  </span>
                  <span class="text-muted">{{ row.count }}</span>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </div>
  </UContainer>
</template>
