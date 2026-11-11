// https://nuxt.com/docs/api/configuration/nuxt-config
import { DATABASE_URL } from './shared/constants/database'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    databaseUrl: DATABASE_URL,
    // Secret used to sign group admin cookies. Set NUXT_ADMIN_SECRET to a long random
    // value in production. (Docker Compose takes ADMIN_SECRET and passes it on as
    // NUXT_ADMIN_SECRET.)
    adminSecret: 'dev-insecure-admin-secret',
  },
  app: {
    head: {
      title: 'Rule Wars — Vote on C# coding standards',
      meta: [
        {
          name: 'description',
          content:
            'Browse, vote on, and generate an .editorconfig from Microsoft C# code style (IDE) and code quality (CA) rules.',
        },
      ],
    },
  },
})
