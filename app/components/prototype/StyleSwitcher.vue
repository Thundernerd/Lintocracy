<script setup lang="ts">
// PROTOTYPE (issue #1): floating style switcher. Applies the `?style=` choice client-side
// and lets you cycle styles with the arrows or the ← / → keys. Mounted inside <DevOnly>.
import { findPrototypeStyle, prototypeStyles } from '~/prototype/styles'
// Imported here, not from main.css, so the styles and their fonts stay out of production
// builds along with this <DevOnly> component.
import '~/assets/css/prototype-styles.css'

const route = useRoute()
const router = useRouter()
const appConfig = useAppConfig()

// Snapshot of the default colours so switching back to the baseline restores them exactly.
const defaultColors = { ...appConfig.ui.colors } as Record<string, string>

const current = computed(() => findPrototypeStyle(route.query.style))
const index = computed(() => prototypeStyles.indexOf(current.value))

function apply() {
  const style = current.value
  Object.assign(appConfig.ui.colors, defaultColors, style.colors)
  const html = document.documentElement
  if (style.dataStyle) html.dataset.style = style.dataStyle
  else delete html.dataset.style
}

function go(step: number) {
  const n = prototypeStyles.length
  const next = prototypeStyles[(index.value + step + n) % n]!
  router.replace({ query: { ...route.query, style: next.key } })
}

function onKey(e: KeyboardEvent) {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
  const el = document.activeElement as HTMLElement | null
  if (el?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return
  // Leave arrows alone inside open menus, listboxes and other arrow-driven widgets.
  if (el?.closest('[role="menu"], [role="listbox"], [role="tablist"], [role="radiogroup"], [role="slider"]')) return
  e.preventDefault()
  go(e.key === 'ArrowLeft' ? -1 : 1)
}

// In-app links don't know about ?style=, so carry it over to every navigation that drops it.
const removeGuard = router.beforeEach((to, from) => {
  if (to.query.style !== undefined || from.query.style === undefined) return
  return { path: to.path, hash: to.hash, query: { ...to.query, style: from.query.style } }
})

onMounted(() => {
  apply()
  window.addEventListener('keydown', onKey)
})
watch(current, apply)
onBeforeUnmount(() => {
  removeGuard()
  window.removeEventListener('keydown', onKey)
  Object.assign(appConfig.ui.colors, defaultColors)
  delete document.documentElement.dataset.style
})
</script>

<template>
  <div class="prototype-switcher" role="toolbar" aria-label="Prototype style switcher">
    <button type="button" aria-label="Previous style" @click="go(-1)">←</button>
    <span class="prototype-switcher__label">{{ current.key }} · {{ current.name }}</span>
    <button type="button" aria-label="Next style" @click="go(1)">→</button>
  </div>
</template>

<style scoped>
/* Hard-coded so it never picks up the style being judged. */
.prototype-switcher {
  position: fixed;
  bottom: 64px; /* clears the Nuxt DevTools pill */
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483647;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 9999px;
  background: #111;
  color: #fff;
  border: 2px solid #ff0;
  box-shadow: 0 6px 24px rgb(0 0 0 / 0.45);
  font: 600 13px/1 ui-sans-serif, system-ui, -apple-system, sans-serif;
  letter-spacing: normal;
  text-transform: none;
  user-select: none;
}
.prototype-switcher button {
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 16px;
  cursor: pointer;
}
.prototype-switcher button:hover {
  background: #333;
}
.prototype-switcher__label {
  min-width: 120px;
  text-align: center;
  white-space: nowrap;
}
</style>
