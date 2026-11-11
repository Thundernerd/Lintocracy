<script setup lang="ts">
import type { RuleTally } from '#shared/types/rule'

const props = defineProps<{ tally?: RuleTally }>()

const yes = computed(() => props.tally?.yes ?? 0)
const no = computed(() => props.tally?.no ?? 0)
const total = computed(() => yes.value + no.value)
const yesPct = computed(() => (total.value ? Math.round((yes.value / total.value) * 100) : 0))
</script>

<template>
  <div class="flex flex-col gap-1 w-full">
    <div class="flex items-center justify-between text-xs text-muted">
      <span class="inline-flex items-center gap-1">
        <UIcon name="i-lucide-thumbs-up" class="size-3 text-primary" />
        {{ yes }} yes
      </span>
      <span v-if="total">{{ yesPct }}%</span>
      <span class="inline-flex items-center gap-1">
        {{ no }} no
        <UIcon name="i-lucide-thumbs-down" class="size-3 text-muted" />
      </span>
    </div>
    <div class="h-2 w-full rounded-full bg-elevated overflow-hidden flex" data-tally-bar>
      <div
        v-if="total"
        class="bg-primary h-full transition-all"
        data-tally-yes
        :style="{ width: `${yesPct}%` }"
      />
      <div
        v-if="total"
        class="bg-error/60 h-full transition-all"
        data-tally-no
        :style="{ width: `${100 - yesPct}%` }"
      />
      <div v-else class="h-full w-full bg-elevated" />
    </div>
  </div>
</template>
