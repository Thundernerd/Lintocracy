import type {
  MyVote,
  OptionTally,
  OptionVote,
  RuleTally,
  Severity,
  VoteChoice,
} from '#shared/types/rule'

/** Stable key for an option tally/vote: `<ruleId>::<optionName>`. */
export const optionKey = (ruleId: string, optionName: string) => `${ruleId}::${optionName}`

export function useVoting() {
  const { activeGroupId } = useGroup()

  const tallies = useState<Record<string, RuleTally>>('cv-tallies', () => ({}))
  const myVotes = useState<Record<string, MyVote>>('cv-myvotes', () => ({}))
  const optionTallies = useState<Record<string, OptionTally>>('cv-opt-tallies', () => ({}))
  const myOptionVotes = useState<Record<string, OptionVote>>('cv-opt-myvotes', () => ({}))
  const loadedGroup = useState<string | null>('cv-loaded-group', () => null)
  const pending = useState<boolean>('cv-pending', () => false)

  const hasGroup = computed(() => !!activeGroupId.value)

  function indexTallies(list: RuleTally[]) {
    tallies.value = Object.fromEntries(list.map((t) => [t.ruleId, t]))
  }

  function indexOptionTallies(list: OptionTally[]) {
    optionTallies.value = Object.fromEntries(list.map((t) => [optionKey(t.ruleId, t.optionName), t]))
  }

  function reset() {
    tallies.value = {}
    myVotes.value = {}
    optionTallies.value = {}
    myOptionVotes.value = {}
    loadedGroup.value = null
  }

  async function refreshTallies() {
    const groupId = activeGroupId.value
    if (!groupId) return
    const [summary, optionSummary] = await Promise.all([
      $fetch<RuleTally[]>('/api/votes/summary', { query: { groupId } }),
      $fetch<OptionTally[]>('/api/option-votes/summary', { query: { groupId } }),
    ])
    indexTallies(summary)
    indexOptionTallies(optionSummary)
  }

  async function load(force = false) {
    const groupId = activeGroupId.value
    if (!groupId) {
      reset()
      return
    }
    if (loadedGroup.value === groupId && !force) return
    pending.value = true
    try {
      const query = { groupId }
      const [summary, mine, optionSummary, myOptions] = await Promise.all([
        $fetch<RuleTally[]>('/api/votes/summary', { query }),
        $fetch<MyVote[]>('/api/votes/me', { query }),
        $fetch<OptionTally[]>('/api/option-votes/summary', { query }),
        $fetch<OptionVote[]>('/api/option-votes/me', { query }),
      ])
      indexTallies(summary)
      myVotes.value = Object.fromEntries(mine.map((v) => [v.ruleId, v]))
      indexOptionTallies(optionSummary)
      myOptionVotes.value = Object.fromEntries(
        myOptions.map((v) => [optionKey(v.ruleId, v.optionName), v]),
      )
      loadedGroup.value = groupId
    } finally {
      pending.value = false
    }
  }

  async function submitVote(ruleId: string, vote: VoteChoice, severity: Severity | null) {
    const groupId = activeGroupId.value
    if (!groupId) throw new Error('No active group')
    const previous = myVotes.value[ruleId]
    myVotes.value = { ...myVotes.value, [ruleId]: { ruleId, vote, severity } }
    try {
      await $fetch('/api/votes', { method: 'POST', body: { groupId, ruleId, vote, severity } })
      await refreshTallies()
    } catch (error) {
      const next = { ...myVotes.value }
      if (previous) next[ruleId] = previous
      else delete next[ruleId]
      myVotes.value = next
      throw error
    }
  }

  async function submitOptionVote(ruleId: string, optionName: string, value: string) {
    const groupId = activeGroupId.value
    if (!groupId) throw new Error('No active group')
    const key = optionKey(ruleId, optionName)
    const previous = myOptionVotes.value[key]
    myOptionVotes.value = { ...myOptionVotes.value, [key]: { ruleId, optionName, value } }
    try {
      await $fetch('/api/option-votes', {
        method: 'POST',
        body: { groupId, ruleId, optionName, value },
      })
      await refreshTallies()
    } catch (error) {
      const next = { ...myOptionVotes.value }
      if (previous) next[key] = previous
      else delete next[key]
      myOptionVotes.value = next
      throw error
    }
  }

  async function removeVote(ruleId: string) {
    const groupId = activeGroupId.value
    if (!groupId) throw new Error('No active group')
    const previous = myVotes.value[ruleId]
    const next = { ...myVotes.value }
    delete next[ruleId]
    myVotes.value = next
    try {
      await $fetch('/api/votes', { method: 'DELETE', body: { groupId, ruleId } })
      await refreshTallies()
    } catch (error) {
      const next = { ...myVotes.value }
      if (previous) next[ruleId] = previous
      myVotes.value = next
      throw error
    }
  }

  async function removeOptionVote(ruleId: string, optionName: string) {
    const groupId = activeGroupId.value
    if (!groupId) throw new Error('No active group')
    const key = optionKey(ruleId, optionName)
    const previous = myOptionVotes.value[key]
    const next = { ...myOptionVotes.value }
    delete next[key]
    myOptionVotes.value = next
    try {
      await $fetch('/api/option-votes', {
        method: 'DELETE',
        body: { groupId, ruleId, optionName },
      })
      await refreshTallies()
    } catch (error) {
      const restored = { ...myOptionVotes.value }
      if (previous) restored[key] = previous
      else delete restored[key]
      myOptionVotes.value = restored
      throw error
    }
  }

  return {
    tallies,
    myVotes,
    optionTallies,
    myOptionVotes,
    loadedGroup,
    pending,
    hasGroup,
    load,
    reset,
    refreshTallies,
    submitVote,
    submitOptionVote,
    removeVote,
    removeOptionVote,
  }
}
