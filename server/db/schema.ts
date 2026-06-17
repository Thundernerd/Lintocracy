import { sqliteTable, integer, text, uniqueIndex, index } from 'drizzle-orm/sqlite-core'

export const groups = sqliteTable('groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  inviteToken: text('invite_token').notNull().unique(),
  createdAt: integer('created_at').notNull(),
})

export type GroupRow = typeof groups.$inferSelect

export const members = sqliteTable(
  'members',
  {
    id: text('id').primaryKey(),
    groupId: text('group_id').notNull(),
    name: text('name').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [index('members_group_idx').on(table.groupId)],
)

export type MemberRow = typeof members.$inferSelect

export const votes = sqliteTable(
  'votes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    groupId: text('group_id').notNull(),
    ruleId: text('rule_id').notNull(),
    voterId: text('voter_id').notNull(),
    vote: text('vote', { enum: ['yes', 'no'] }).notNull(),
    severity: text('severity', { enum: ['none', 'suggestion', 'warning', 'error'] }),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('votes_group_rule_voter_idx').on(table.groupId, table.ruleId, table.voterId),
  ],
)

export type VoteRow = typeof votes.$inferSelect

export const optionVotes = sqliteTable(
  'option_votes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    groupId: text('group_id').notNull(),
    ruleId: text('rule_id').notNull(),
    optionName: text('option_name').notNull(),
    voterId: text('voter_id').notNull(),
    value: text('value').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('option_votes_group_rule_option_voter_idx').on(
      table.groupId,
      table.ruleId,
      table.optionName,
      table.voterId,
    ),
  ],
)

export type OptionVoteRow = typeof optionVotes.$inferSelect
