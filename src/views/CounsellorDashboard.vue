<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/composables/useAuth'
import SiteHeader from '@/components/layout/SiteHeader.vue'

interface JournalEntry {
  id: string
  situation: string | null
  went_well: string | null
  was_hard: string | null
  do_differently: string | null
  created_at: string
  profiles: { display_name: string | null }
}

const { signOut } = useAuth()
const entries = ref<JournalEntry[]>([])
const loading = ref(true)

onMounted(async () => {
  const { data } = await supabase
    .from('journal_entries')
    .select('id, situation, went_well, was_hard, do_differently, created_at, profiles(display_name)')
    .eq('shared_with_counsellor', true)
    .order('created_at', { ascending: false })
  entries.value = (data as unknown as JournalEntry[]) ?? []
  loading.value = false
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="dashboard-page">
    <SiteHeader />

    <main class="dashboard-main">
      <div class="dashboard-inner">
        <div class="dashboard-header">
          <div>
            <h1 class="dashboard-title">Counsellor Dashboard</h1>
            <p class="dashboard-subtitle">Shared journal entries from learners</p>
          </div>
          <button class="signout-btn" @click="signOut">Sign out</button>
        </div>

        <div v-if="loading" class="state-message">Loading entries…</div>

        <div v-else-if="entries.length === 0" class="state-message">
          No shared entries yet.
        </div>

        <ul v-else class="entry-list">
          <li v-for="entry in entries" :key="entry.id" class="entry-card">
            <div class="entry-meta">
              <span class="entry-author">{{ entry.profiles?.display_name ?? 'Anonymous' }}</span>
              <span class="entry-date">{{ formatDate(entry.created_at) }}</span>
            </div>

            <div v-if="entry.situation" class="entry-section">
              <h3 class="entry-label">Situation</h3>
              <p class="entry-text">{{ entry.situation }}</p>
            </div>
            <div v-if="entry.went_well" class="entry-section">
              <h3 class="entry-label">What went well</h3>
              <p class="entry-text">{{ entry.went_well }}</p>
            </div>
            <div v-if="entry.was_hard" class="entry-section">
              <h3 class="entry-label">What was hard</h3>
              <p class="entry-text">{{ entry.was_hard }}</p>
            </div>
            <div v-if="entry.do_differently" class="entry-section">
              <h3 class="entry-label">What to do differently</h3>
              <p class="entry-text">{{ entry.do_differently }}</p>
            </div>
          </li>
        </ul>
      </div>
    </main>
  </div>
</template>

<style scoped>
.dashboard-page {
  min-height: 100svh;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
}

.dashboard-main {
  flex: 1;
  padding: 6rem var(--space-page-x) 3rem;
}

.dashboard-inner {
  max-width: var(--max-content);
  margin-inline: auto;
}

.dashboard-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 2.5rem;
  gap: 1rem;
}

.dashboard-title {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: var(--font-weight-heading);
  color: var(--color-text-strong);
  margin: 0 0 0.25rem;
}

.dashboard-subtitle {
  font-size: var(--text-body);
  color: var(--color-text);
  margin: 0;
}

.signout-btn {
  padding: 0.5rem 1.25rem;
  background: transparent;
  border: 1.5px solid var(--color-radio-border);
  border-radius: var(--radius-pill);
  font-size: 0.875rem;
  font-family: var(--font-sans);
  color: var(--color-text);
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s, color 0.15s;
}

.signout-btn:hover {
  border-color: var(--color-text-strong);
  color: var(--color-text-strong);
}

.state-message {
  color: var(--color-text);
  font-size: var(--text-body);
  padding: 2rem 0;
}

.entry-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.entry-card {
  background: #fff;
  border: 1.5px solid var(--color-surface-muted);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.entry-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.entry-author {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-strong);
  font-size: 0.9375rem;
}

.entry-date {
  font-size: 0.875rem;
  color: var(--color-text);
}

.entry-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.entry-label {
  font-size: 0.75rem;
  font-weight: var(--font-weight-medium);
  color: var(--color-badge-text);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}

.entry-text {
  font-size: 0.9375rem;
  color: var(--color-text);
  line-height: var(--line-height-body);
  margin: 0;
}
</style>
