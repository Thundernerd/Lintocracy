<script setup lang="ts">
import type { Severity } from '#shared/types/rule'

const props = withDefaults(
  defineProps<{ severity: Severity; size?: 'sm' | 'md' }>(),
  { size: 'sm' },
)
</script>

<template>
  <UBadge
    :color="severityColor[props.severity]"
    :icon="severityIcon[props.severity]"
    :size="props.size"
    variant="subtle"
  >
    {{ severityLabel[props.severity] }}
  </UBadge>
</template>
