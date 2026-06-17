import { rules } from '../data/rules'
import { validateRules } from '../utils/ruleSchema'
import { ensureSchema } from '../db'

export default defineNitroPlugin(async () => {
  validateRules(rules)
  await ensureSchema()
})
