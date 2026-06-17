<script setup lang="ts">
const severities = [
  { name: 'error', description: 'Violations are reported as build errors and fail the build.' },
  { name: 'warning', description: 'Violations are reported as build warnings.' },
  { name: 'suggestion', description: 'Shown as a subtle hint / suggestion in the IDE.' },
  { name: 'none', description: 'The rule is disabled and never reported.' },
]
</script>

<template>
  <UContainer class="py-10 max-w-3xl">
    <h1 class="text-2xl font-bold">About Rule Wars</h1>
    <div class="prose dark:prose-invert mt-4 max-w-none">
      <p class="text-muted">
        Rule Wars is a team tool for deciding which of Microsoft's official C#
        analyzer rules to enable, and at what severity. Create a group, invite your
        teammates with a link, and vote together. Vote <strong>Yes</strong> on a rule
        to enable it and choose a severity, or <strong>No</strong> to leave it off
        (mapped to <code>none</code>). Your group's votes are aggregated into a consensus
        <code>.editorconfig</code>.
      </p>

      <h2 class="text-lg font-semibold mt-8">Severity levels</h2>
      <ul class="mt-2 space-y-2">
        <li v-for="s in severities" :key="s.name" class="text-muted">
          <code class="text-primary">{{ s.name }}</code> — {{ s.description }}
        </li>
      </ul>

      <h2 class="text-lg font-semibold mt-8">Groups &amp; fairness</h2>
      <p class="text-muted">
        Each group is private: votes, results, and the generated
        <code>.editorconfig</code> are scoped to the group. You join by entering your
        name behind an invite link, and your ballot is one per browser per group. The
        person who creates a group sets an admin password, which lets them rename the
        group, clear its votes, and reclaim admin access. This is a best-effort team
        signal, not a hardened election — clearing cookies resets your membership.
      </p>
    </div>
  </UContainer>
</template>
