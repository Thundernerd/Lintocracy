<script setup lang="ts">
import { APP_NAME, DEFAULT_TITLE } from '#shared/constants/app'

// Pages set only their own part of the title; the app name is appended here.
useHead({
  titleTemplate: (title) => (title ? `${title} — ${APP_NAME}` : DEFAULT_TITLE),
})
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
