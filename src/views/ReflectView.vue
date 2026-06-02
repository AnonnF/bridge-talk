<template>
  <div class="reflect-list">
    <div class="reflect-header">
      <h1>Your Journal</h1>
      <RouterLink to="/reflect/new">
        <button>+ New Entry</button>
      </RouterLink>
    </div>

    <p v-if="entries.length === 0" class="empty-state">
      No entries yet. After a real conversation, log how it went.
    </p>

    <div v-for="entry in entries" :key="entry.id" class="journal-card">
      <p class="date">{{ formatDate(entry.createdAt) }}</p>
      <p><strong>Situation:</strong> {{ entry.situation }}</p>
      <p><strong>Went well:</strong> {{ entry.wentWell }}</p>
      <p><strong>Was hard:</strong> {{ entry.wasHard }}</p>
      <p><strong>Next time:</strong> {{ entry.doDifferently }}</p>
      <div class="card-actions">
        <button @click="toggleShare(entry.id)">
          {{
            entry.sharedWithCounsellor ? '✓ Shared' : 'Share with counsellor'
          }}
        </button>
        <button @click="deleteEntry(entry.id)">Delete</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useJournal } from '@/composables/useJournal'

const { entries, deleteEntry, toggleShare } = useJournal()

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>
