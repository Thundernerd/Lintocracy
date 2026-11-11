<script setup lang="ts">
import type { Rule, RuleTally } from '#shared/types/rule'

const props = defineProps<{ rule: Rule; tally?: RuleTally; hideGroup?: boolean }>()
</script>

<template>
  <UCard class="h-full flex flex-col">
    <div class="flex flex-col gap-3 flex-1">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <UBadge
            :color="rule.category === 'style' ? 'info' : 'secondary'"
            variant="subtle"
            size="sm"
          >
            {{ rule.id }}
          </UBadge>
          <span v-if="!hideGroup" class="text-xs text-muted">{{ rule.group }}</span>
        </div>
        <div class="flex items-center gap-2">
          <UTooltip
            v-if="rule.related?.length"
            :text="`Related: ${rule.related.join(', ')}`"
          >
            <span class="inline-flex items-center gap-0.5 text-xs text-muted">
              <UIcon name="i-lucide-link" class="size-3.5" />
              {{ rule.related.length }}
            </span>
          </UTooltip>
          <SeverityBadge
            v-if="tally?.consensusEnabled"
            :severity="tally.consensusSeverity"
          />
        </div>
      </div>

      <NuxtLink :to="`/rules/${rule.id}`" class="group">
        <h3 class="text-[length:inherit] leading-[inherit] group-hover:text-primary transition-colors">
          {{ rule.title }}
        </h3>
      </NuxtLink>
      <p class="text-sm text-muted line-clamp-2">{{ rule.summary }}</p>

      <TallyBar :tally="tally" class="mt-auto" />
    </div>

    <template #footer>
      <div class="flex items-center justify-between gap-3">
        <VoteControl :rule-id="rule.id" :default-severity="rule.defaultSeverity" />
        <UButton
          :to="`/rules/${rule.id}`"
          color="neutral"
          variant="ghost"
          icon="i-lucide-arrow-right"
          square
          aria-label="View rule details"
        />
      </div>
    </template>
  </UCard>
</template>
