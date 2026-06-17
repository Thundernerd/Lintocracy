import { z } from 'zod'
import { SEVERITIES } from '#shared/types/rule'

export const severitySchema = z.enum(SEVERITIES as [string, ...string[]])

export const ruleSchema = z.object({
  id: z.string().regex(/^(IDE|CA)\d{4}$/, 'id must look like IDE0011 or CA2007'),
  title: z.string().min(1),
  category: z.enum(['style', 'quality']),
  group: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().min(1).optional(),
  whyItMatters: z.string().min(1).optional(),
  examples: z
    .object({
      bad: z.string().optional(),
      good: z.string().optional(),
    })
    .optional(),
  docsUrl: z.url(),
  defaultSeverity: severitySchema,
  supportsSeverity: z.boolean(),
  editorconfig: z.object({
    diagnosticId: z.string().min(1),
    options: z
      .array(z.object({ key: z.string().min(1), value: z.string().min(1) }))
      .optional(),
  }),
  curated: z.boolean().optional(),
  subcategory: z.string().optional(),
  cause: z.string().optional(),
  howToFix: z.string().optional(),
  whenToSuppress: z.string().optional(),
  enabledByDefault: z.string().optional(),
  options: z
    .array(
      z.object({
        name: z.string().min(1),
        defaultValue: z.string().optional(),
        values: z
          .array(z.object({ value: z.string().min(1), description: z.string().optional() }))
          .optional(),
      }),
    )
    .optional(),
  example: z.string().optional(),
  related: z.array(z.string()).optional(),
})

export const rulesSchema = z.array(ruleSchema)

export function validateRules(data: unknown) {
  const result = rulesSchema.safeParse(data)
  if (!result.success) {
    throw new Error(`Invalid rules dataset:\n${z.prettifyError(result.error)}`)
  }
  const ids = result.data.map((r) => r.id)
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
  if (dupes.length) {
    throw new Error(`Duplicate rule ids in dataset: ${[...new Set(dupes)].join(', ')}`)
  }
  return result.data
}
