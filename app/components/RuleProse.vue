<script setup lang="ts">
/** `inline` renders a single line (no `<p>`/`<ul>` blocks) inside a `<span>`. */
const props = defineProps<{ text?: string; inline?: boolean }>()
const html = computed(() =>
  props.inline ? renderInlineProse(props.text) : renderProse(props.text),
)
</script>

<template>
  <span v-if="inline" class="rule-prose text-muted" v-html="html" />
  <div v-else class="rule-prose text-muted" v-html="html" />
</template>

<style scoped>
.rule-prose :deep(p) {
  margin: 0 0 0.5rem;
}
.rule-prose :deep(p:last-child) {
  margin-bottom: 0;
}
.rule-prose :deep(ul) {
  list-style: disc;
  padding-left: 1.25rem;
  margin: 0.25rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.rule-prose :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.85em;
  background: var(--ui-bg-elevated);
  padding: 0.1rem 0.3rem;
  border-radius: 0.25rem;
}
</style>
