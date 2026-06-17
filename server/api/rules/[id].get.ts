import { rules } from '../../data/rules'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const rule = rules.find((r) => r.id === id)
  if (!rule) {
    throw createError({ statusCode: 404, statusMessage: `Unknown rule: ${id}` })
  }
  return rule
})
