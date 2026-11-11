<script setup lang="ts">
useHead({ title: 'Create a group' })

const { createGroup } = useGroup()
const toast = useToast()
const router = useRouter()

const name = ref('')
const displayName = ref('')
const password = ref('')
const busy = ref(false)

async function submit() {
  if (!name.value.trim() || !displayName.value.trim() || password.value.length < 4) {
    toast.add({
      title: 'Fill in all fields (password min 4 chars)',
      color: 'warning',
      icon: 'i-lucide-triangle-alert',
    })
    return
  }
  busy.value = true
  try {
    const { id } = await createGroup({
      name: name.value.trim(),
      displayName: displayName.value.trim(),
      password: password.value,
    })
    toast.add({ title: 'Group created', color: 'success', icon: 'i-lucide-check' })
    router.push(`/g/${id}`)
  } catch {
    toast.add({ title: 'Could not create the group', color: 'error', icon: 'i-lucide-x' })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <UContainer class="py-12 max-w-lg">
    <div class="flex items-center gap-2 mb-2">
      <UIcon name="i-lucide-users" class="size-6 text-primary" />
      <h1>Create a group</h1>
    </div>
    <p class="text-muted mb-8">
      Start a team, invite people with a link, and vote on C# standards together.
    </p>

    <UCard>
      <form class="flex flex-col gap-5" @submit.prevent="submit">
        <UFormField label="Group name" required>
          <UInput v-model="name" placeholder="e.g. Platform Team" size="lg" class="w-full" />
        </UFormField>

        <UFormField label="Your name" required help="Shown to other members in the roster.">
          <UInput v-model="displayName" placeholder="e.g. Alex" size="lg" class="w-full" />
        </UFormField>

        <UFormField
          label="Admin password"
          required
          help="You'll use this to manage the group (reset votes, rename). Keep it safe."
        >
          <UInput
            v-model="password"
            type="password"
            placeholder="At least 4 characters"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UButton
          type="submit"
          size="lg"
          icon="i-lucide-plus"
          :loading="busy"
          block
        >
          Create group
        </UButton>
      </form>
    </UCard>
  </UContainer>
</template>
