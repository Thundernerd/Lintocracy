<script setup lang="ts">
const props = withDefaults(
  defineProps<{ code: string; lang?: string }>(),
  { lang: 'csharp' },
)

const colorMode = useColorMode()
const html = ref('')

async function render() {
  try {
    const highlighter = await getHighlighter()
    html.value = highlighter.codeToHtml(props.code, {
      lang: props.lang,
      theme: colorMode.value === 'dark' ? 'github-dark' : 'github-light',
    })
  } catch {
    html.value = ''
  }
}

watch(() => [props.code, colorMode.value], render)
onMounted(render)
</script>

<template>
  <ClientOnly>
    <div v-if="html" class="code-block text-sm rounded-lg overflow-x-auto" v-html="html" />
    <pre
      v-else
      class="code-block-fallback text-sm rounded-lg overflow-x-auto"
    ><code class="block w-max min-w-full bg-elevated p-3 rounded-lg">{{ code }}</code></pre>
    <template #fallback>
      <pre
        class="code-block-fallback text-sm rounded-lg overflow-x-auto"
      ><code class="block w-max min-w-full bg-elevated p-3 rounded-lg">{{ code }}</code></pre>
    </template>
  </ClientOnly>
</template>

<style scoped>
.code-block :deep(pre.shiki) {
  padding: 0.75rem 1rem;
  margin: 0;
  border-radius: 0.5rem;
  white-space: pre;
  width: max-content;
  min-width: 100%;
}
.code-block-fallback {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  white-space: pre;
}
</style>
