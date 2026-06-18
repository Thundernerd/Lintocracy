<script setup lang="ts">
import type { Severity } from '#shared/types/rule'

const props = withDefaults(
  defineProps<{ ruleId: string; defaultSeverity?: Severity }>(),
  { defaultSeverity: 'warning' },
)

const { myVotes, submitVote, removeVote, hasGroup } = useVoting()
const toast = useToast()
const busy = ref(false)

const my = computed(() => myVotes.value[props.ruleId])
const choice = computed(() => my.value?.vote)
const chosenSeverity = computed<Severity | null>(() => my.value?.severity ?? null)

function fallbackSeverity(): Severity {
  if (chosenSeverity.value && chosenSeverity.value !== 'none') return chosenSeverity.value
  return props.defaultSeverity !== 'none' ? props.defaultSeverity : 'warning'
}

async function clear() {
  busy.value = true
  try {
    await removeVote(props.ruleId)
  } catch {
    toast.add({ title: 'Could not remove your vote', color: 'error', icon: 'i-lucide-x' })
  } finally {
    busy.value = false
  }
}

async function cast(vote: 'yes' | 'no', severity: Severity | null) {
  if (vote === 'yes' && choice.value === 'yes' && severity === chosenSeverity.value) {
    await clear()
    return
  }
  if (vote === 'no' && choice.value === 'no') {
    await clear()
    return
  }

  busy.value = true
  try {
    await submitVote(props.ruleId, vote, severity)
  } catch {
    toast.add({ title: 'Could not save your vote', color: 'error', icon: 'i-lucide-x' })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <UButton
    v-if="!hasGroup"
    to="/"
    size="sm"
    color="neutral"
    variant="subtle"
    icon="i-lucide-users"
  >
    Join a group to vote
  </UButton>

  <div v-else class="flex flex-col gap-2">
    <div class="flex flex-wrap items-center gap-2">
      <UButton
        :color="choice === 'yes' ? 'primary' : 'neutral'"
        :variant="choice === 'yes' ? 'solid' : 'outline'"
        icon="i-lucide-thumbs-up"
        :loading="busy && choice === 'yes'"
        :disabled="busy"
        @click="cast('yes', fallbackSeverity())"
      >
        Yes
      </UButton>
      <UButton
        :color="choice === 'no' ? 'error' : 'neutral'"
        :variant="choice === 'no' ? 'solid' : 'outline'"
        icon="i-lucide-thumbs-down"
        :loading="busy && choice === 'no'"
        :disabled="busy"
        @click="cast('no', null)"
      >
        No
      </UButton>
      <UButton
        v-if="choice"
        size="sm"
        color="neutral"
        variant="link"
        icon="i-lucide-undo-2"
        :disabled="busy"
        @click="clear"
      >
        Remove vote
      </UButton>
    </div>

    <div
      v-if="choice === 'yes'"
      class="flex flex-col gap-1"
    >
      <span class="text-xs text-muted">Severity</span>
      <div class="flex items-center gap-1">
        <UButton
          v-for="sev in yesSeverities"
          :key="sev"
          size="xs"
          :color="chosenSeverity === sev ? severityColor[sev] : 'neutral'"
          :variant="chosenSeverity === sev ? 'solid' : 'subtle'"
          :icon="severityIcon[sev]"
          :disabled="busy"
          @click="cast('yes', sev)"
        >
          {{ severityLabel[sev] }}
        </UButton>
      </div>
    </div>
  </div>
</template>
