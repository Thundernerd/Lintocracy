// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || 'file:.data/rule-wars.db',
    databaseAuthToken: process.env.DATABASE_AUTH_TOKEN || '',
    // Secret used to sign group admin cookies. Set ADMIN_SECRET in production.
    adminSecret: process.env.ADMIN_SECRET || 'dev-insecure-admin-secret',
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
