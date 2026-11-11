<script setup lang="ts">
import type { RuleOption } from '#shared/types/rule'

const props = defineProps<{ ruleId: string; option: RuleOption }>()

const { optionTallies, myOptionVotes, submitOptionVote, removeOptionVote, hasGroup } = useVoting()
const toast = useToast()
const busy = ref(false)

const key = computed(() => optionKey(props.ruleId, props.option.name))
const tally = computed(() => optionTallies.value[key.value])
const myValue = computed(() => myOptionVotes.value[key.value]?.value ?? null)
const consensus = computed(() => tally.value?.consensusValue ?? null)

function count(value: string) {
  return tally.value?.counts[value] ?? 0
}

async function clear() {
  busy.value = true
  try {
    await removeOptionVote(props.ruleId, props.option.name)
  } catch {
    toast.add({ title: 'Could not remove your option vote', color: 'error', icon: 'i-lucide-x' })
  } finally {
    busy.value = false
  }
}

async function vote(value: string) {
  if (!hasGroup.value) return
  if (myValue.value === value) {
    await clear()
    return
  }

  busy.value = true
  try {
    await submitOptionVote(props.ruleId, props.option.name, value)
  } catch {
    toast.add({ title: 'Could not save your option vote', color: 'error', icon: 'i-lucide-x' })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="rounded-lg border border-default p-4 flex flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <code class="text-sm text-primary">{{ option.name }}</code>
      <div class="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span v-if="option.defaultValue">
          default: <code>{{ option.defaultValue }}</code>
        </span>
        <span v-if="tally?.total">· {{ tally.total }} vote{{ tally.total === 1 ? '' : 's' }}</span>
        <UButton
          v-if="myValue"
          size="xs"
          color="neutral"
          variant="link"
          icon="i-lucide-undo-2"
          :disabled="busy || !hasGroup"
          class="px-0"
          @click="clear"
        >
          Remove vote
        </UButton>
      </div>
    </div>

    <div v-if="option.values?.length" class="flex flex-col gap-2">
      <button
        v-for="val in option.values"
        :key="val.value"
        type="button"
        :disabled="busy || !hasGroup"
        class="group flex items-start gap-3 rounded-md border p-2.5 text-left text-sm transition-colors disabled:cursor-default"
        :class="[
          myValue === val.value
            ? 'border-primary bg-primary/10'
            : 'border-default',
          hasGroup ? 'hover:border-primary/50 hover:bg-elevated/50' : '',
        ]"
        @click="vote(val.value)"
      >
        <UIcon
          :name="myValue === val.value ? 'i-lucide-check-circle-2' : 'i-lucide-circle'"
          class="size-4 mt-0.5 shrink-0"
          :class="myValue === val.value ? 'text-primary' : 'text-muted'"
        />
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <code class="px-1.5 py-0.5 rounded bg-elevated">{{ val.value }}</code>
            <UBadge
              v-if="consensus === val.value && tally?.total"
              size="sm"
              color="primary"
              variant="subtle"
            >
              Consensus
            </UBadge>
          </div>
          <p
            v-if="val.description"
            class="option-prose text-muted mt-1"
            v-html="renderInlineProse(val.description)"
          />
        </div>
        <span class="shrink-0 text-xs text-muted tabular-nums">{{ count(val.value) }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.option-prose :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.85em;
  background: var(--ui-bg-elevated);
  padding: 0.1rem 0.3rem;
  border-radius: 0.25rem;
}
</style>
