import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseOptions } from './docs-markdown.mjs'

const optionsPage = (...tables) => `# IDE9999

## Options

${tables
  .map(
    (t) =>
      `### ${t.name}\n\n| Property | Value | Description |\n|--|--|--|\n| **Option name** | ${t.name} |  |\n${t.rows.join('\n')}\n`,
  )
  .join('\n')}
## Next section
`

test('an Options table whose "Option values" cell is a description yields a free-form option', () => {
  const md = optionsPage({
    name: 'csharp_preferred_modifier_order',
    rows: [
      '| **Applicable languages** | C# |  |',
      '| **Option values** | One or more C# modifiers, such as `public`, `private`, and `protected` |  |',
      '| **Default option value** | `public, private, protected` |  |',
    ],
  })

  assert.deepEqual(parseOptions(md), [
    { name: 'csharp_preferred_modifier_order', defaultValue: 'public, private, protected', values: undefined },
  ])
})

test('a described value beside literal values is dropped and the literals are kept', () => {
  const md = optionsPage({
    name: 'dotnet_remove_unnecessary_suppression_exclusions',
    rows: [
      '| **Option values** | Comma-separated list of rule IDs or categories (prefixed with `category:`) | Excludes suppressions for the listed rules or categories |',
      '|  | `all` | Disables the rule (all rule IDs excluded) |',
      '|  | `none` | Enables the rule for all rules (no exclusions) |',
      '| **Default option value** | `none` |  |',
    ],
  })

  assert.deepEqual(parseOptions(md), [
    {
      name: 'dotnet_remove_unnecessary_suppression_exclusions',
      defaultValue: 'none',
      values: [
        { value: 'all', description: 'Disables the rule (all rule IDs excluded)' },
        { value: 'none', description: 'Enables the rule for all rules (no exclusions)' },
      ],
    },
  ])
})

test('an option whose values are all literals keeps them as enumerated values', () => {
  const md = optionsPage({
    name: 'csharp_style_var_elsewhere',
    rows: [
      '| **Option values** | `true` | Prefer `var`. |',
      '|  | `false` | Prefer explicit types. |',
      '| **Default option value** | `false` |  |',
    ],
  })

  assert.deepEqual(parseOptions(md), [
    {
      name: 'csharp_style_var_elsewhere',
      defaultValue: 'false',
      values: [
        { value: 'true', description: 'Prefer `var`.' },
        { value: 'false', description: 'Prefer explicit types.' },
      ],
    },
  ])
})
