import { rules } from '../data/rules'
import { validateRules } from '../utils/ruleSchema'
import { databaseReady } from '../db'

export default defineNitroPlugin((nitroApp) => {
  validateRules(rules)
  // Start the schema setup now, so it is usually done before the first request. Nitro does
  // not await plugins, so requests wait for it in `useDb()`; here we only report a failure,
  // to the console and to Nitro's `error` hook.
  databaseReady().catch((error: unknown) => {
    console.error('[db] Schema setup failed; requests will retry it.', error)
    nitroApp.captureError(error as Error, { tags: ['plugin', 'db'] })
  })
})
