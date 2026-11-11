<script setup lang="ts">
const { activeGroupId, joinedGroups } = useGroup()
const activeGroup = computed(
  () => joinedGroups.value?.find((g) => g.id === activeGroupId.value) ?? null,
)

const features = [
  {
    icon: 'i-lucide-users',
    title: 'Create a team',
    description:
      'Spin up a group with an admin password, then share one invite link so teammates join by entering their name.',
  },
  {
    icon: 'i-lucide-vote',
    title: 'Vote together',
    description:
      'Each member votes Yes/No with a severity, and votes on configurable options, scoped privately to your group.',
  },
  {
    icon: 'i-lucide-file-code-2',
    title: 'Generate .editorconfig',
    description:
      "Turn your team's consensus into a ready-to-use .editorconfig, optionally backfilled with Microsoft defaults.",
  },
]
</script>

<template>
  <div>
    <UContainer class="py-20 text-center">
      <UBadge variant="subtle" color="primary" class="mb-4">
        Team voting on C# standards
      </UBadge>
      <h1 class="text-4xl sm:text-6xl max-w-3xl mx-auto">
        Vote on C# coding standards, together.
      </h1>
      <p class="mt-6 text-lg text-muted max-w-2xl mx-auto">
        Rule Wars lets your team vote on Microsoft's official C# code style and code
        quality rules, then turns the consensus into a shareable
        <code class="text-primary">.editorconfig</code>.
      </p>

      <ClientOnly>
        <div v-if="activeGroup" class="mt-8 flex flex-col items-center gap-3">
          <p class="text-sm text-muted">
            You're in <strong>{{ activeGroup.name }}</strong>.
          </p>
          <div class="flex items-center justify-center gap-3">
            <UButton to="/rules" size="lg" icon="i-lucide-list-checks">Vote on rules</UButton>
            <UButton
              :to="`/g/${activeGroup.id}`"
              size="lg"
              color="neutral"
              variant="subtle"
              icon="i-lucide-settings"
            >
              Manage group
            </UButton>
          </div>
        </div>
        <div v-else class="mt-8 flex items-center justify-center gap-3">
          <UButton to="/groups/new" size="lg" icon="i-lucide-users">Create a group</UButton>
          <UButton
            to="/rules"
            size="lg"
            color="neutral"
            variant="subtle"
            icon="i-lucide-list-checks"
          >
            Browse rules
          </UButton>
        </div>
        <template #fallback>
          <div class="mt-8 flex items-center justify-center gap-3">
            <UButton to="/groups/new" size="lg" icon="i-lucide-users">Create a group</UButton>
            <UButton
              to="/rules"
              size="lg"
              color="neutral"
              variant="subtle"
              icon="i-lucide-list-checks"
            >
              Browse rules
            </UButton>
          </div>
        </template>
      </ClientOnly>
    </UContainer>

    <UContainer class="pb-20">
      <div class="grid gap-6 sm:grid-cols-3">
        <UCard v-for="feature in features" :key="feature.title">
          <div class="flex flex-col gap-3">
            <UIcon :name="feature.icon" class="size-8 text-primary" />
            <h3>{{ feature.title }}</h3>
            <p class="text-sm text-muted">{{ feature.description }}</p>
          </div>
        </UCard>
      </div>
    </UContainer>
  </div>
</template>
