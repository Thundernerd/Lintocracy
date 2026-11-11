<script setup lang="ts">
const links = [
  { label: 'Rules', to: '/rules', icon: 'i-lucide-list-checks' },
  { label: 'Results', to: '/results', icon: 'i-lucide-bar-chart-3' },
  { label: 'About', to: '/about', icon: 'i-lucide-info' },
]

const { activeGroupId, joinedGroups, setActive } = useGroup()
const router = useRouter()

const activeGroup = computed(
  () => joinedGroups.value?.find((g) => g.id === activeGroupId.value) ?? null,
)

function switchTo(id: string) {
  setActive(id)
  router.push(`/g/${id}`)
}

const groupMenuItems = computed(() => {
  const groups = (joinedGroups.value ?? []).map((g) => ({
    label: g.name,
    icon: g.id === activeGroupId.value ? 'i-lucide-check' : 'i-lucide-users',
    onSelect: () => switchTo(g.id),
  }))
  const actions = [
    ...(activeGroup.value
      ? [
          {
            label: 'Manage current group',
            icon: 'i-lucide-settings',
            onSelect: () => router.push(`/g/${activeGroupId.value}`),
          },
        ]
      : []),
    { label: 'Create a group', icon: 'i-lucide-plus', to: '/groups/new' },
  ]
  return groups.length ? [groups, actions] : [actions]
})

const colorMode = useColorMode()
const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (val) => {
    colorMode.preference = val ? 'dark' : 'light'
  },
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-default text-default">
    <header
      class="sticky top-0 z-50 border-b border-default bg-default/80 backdrop-blur"
    >
      <UContainer class="flex items-center justify-between gap-4 h-16">
        <NuxtLink to="/" class="flex items-center gap-2 font-bold text-lg">
          <UIcon name="i-lucide-vote" class="text-primary size-6" />
          <span>Rule Wars</span>
        </NuxtLink>

        <nav class="hidden sm:flex items-center gap-1">
          <UButton
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            :icon="link.icon"
            color="neutral"
            variant="ghost"
            active-class="text-primary"
          >
            {{ link.label }}
          </UButton>
        </nav>

        <div class="flex items-center gap-2">
          <ClientOnly>
            <UDropdownMenu :items="groupMenuItems" :popper="{ placement: 'bottom-end' }">
              <UButton
                color="neutral"
                variant="subtle"
                icon="i-lucide-users"
                trailing-icon="i-lucide-chevron-down"
                class="max-w-44"
              >
                <span class="truncate">{{ activeGroup?.name ?? 'No group' }}</span>
              </UButton>
            </UDropdownMenu>
            <template #fallback>
              <div class="h-8 w-28" />
            </template>
          </ClientOnly>
          <ClientOnly>
            <UButton
              :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
              color="neutral"
              variant="ghost"
              aria-label="Toggle color mode"
              @click="isDark = !isDark"
            />
            <template #fallback>
              <div class="size-8" />
            </template>
          </ClientOnly>
        </div>
      </UContainer>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-t border-default mt-12">
      <UContainer
        class="py-6 text-sm text-muted flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left"
      >
        <span>Rule Wars — team voting on C# coding standards.</span>
        <span>
          Idea by the one and only amazing
          <a
            href="https://brunomikoski.com"
            target="_blank"
            rel="noopener"
            class="text-primary hover:underline"
          >Bruno Mikoski</a>.
        </span>
        <span>
          Rules sourced from
          <a
            href="https://learn.microsoft.com/dotnet/fundamentals/code-analysis/"
            target="_blank"
            rel="noopener"
            class="text-primary hover:underline"
          >Microsoft Learn</a>.
        </span>
      </UContainer>
    </footer>

    <!-- PROTOTYPE (issue #1): visual-style switcher, dev server only. -->
    <DevOnly>
      <ClientOnly>
        <PrototypeStyleSwitcher />
      </ClientOnly>
    </DevOnly>
  </div>
</template>
