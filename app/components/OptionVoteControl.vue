<script setup lang="ts">
import type { RuleOption, RuleOptionValue } from '#shared/types/rule'
import {
  acceptsTypedValues,
  isDocumentedOptionValue,
  typedOptionValueError,
} from '#shared/utils/optionValue'

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

const hasDocumentedValues = computed(() => !!props.option.values?.length)
const acceptsOther = computed(() => acceptsTypedValues(props.option))

/** Documented values first, then typed values the group has voted for, most votes first. */
const choices = computed<RuleOptionValue[]>(() => {
  const documented = props.option.values ?? []
  if (!acceptsOther.value) return documented
  const known = new Set(documented.map((v) => v.value))
  const typed = new Set(Object.keys(tally.value?.counts ?? {}).filter((v) => count(v) > 0))
  if (myValue.value) typed.add(myValue.value)
  const others = [...typed]
    .filter((v) => !known.has(v))
    .sort((a, b) => count(b) - count(a) || a.localeCompare(b))
    .map((value) => ({ value }))
  return [...documented, ...others]
})

/**
 * The text input holds my typed vote. Without one it starts from the documented
 * default, or empty when the documented values already have their own buttons.
 */
function initialDraft(value: string | null) {
  if (value && !isDocumentedOptionValue(props.option, value)) return value
  return hasDocumentedValues.value ? '' : (props.option.defaultValue ?? '')
}
const draft = ref('')
watch(myValue, (value) => (draft.value = initialDraft(value)), { immediate: true })

// An empty draft only disables the button; the hint already asks for a value.
const draftError = computed(() => (draft.value.trim() ? typedOptionValueError(draft.value) : null))
const canVoteTyped = computed(
  () => !!draft.value.trim() && !draftError.value && draft.value.trim() !== myValue.value,
)

const hint = computed(() => {
  if (hasDocumentedValues.value) return 'Or type another value.'
  return choices.value.length
    ? 'Type the value you prefer, or click one above to join it.'
    : 'Type the value you prefer.'
})

async function voteTyped() {
  if (canVoteTyped.value) await vote(draft.value.trim())
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

    <div v-if="choices.length" class="flex flex-col gap-2">
      <button
        v-for="val in choices"
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
          <RuleProse v-if="val.description" inline :text="val.description" class="block mt-1" />
        </div>
        <span class="shrink-0 text-xs text-muted tabular-nums">{{ count(val.value) }}</span>
      </button>
    </div>

    <form v-if="acceptsOther" class="flex flex-col gap-1" @submit.prevent="voteTyped">
      <div class="flex gap-2">
        <UInput
          v-model="draft"
          :aria-label="`Value for ${option.name}`"
          :placeholder="hasDocumentedValues ? 'Another value' : (option.defaultValue ?? 'Type a value')"
          :disabled="busy || !hasGroup"
          class="flex-1 font-mono"
        />
        <UButton
          type="submit"
          :disabled="busy || !hasGroup || !canVoteTyped"
        >
          {{ myValue ? 'Change vote' : 'Vote' }}
        </UButton>
      </div>
      <p v-if="draftError" class="text-xs text-error">{{ draftError }}</p>
      <p v-else class="text-xs text-muted">{{ hint }}</p>
    </form>
  </div>
</template>

