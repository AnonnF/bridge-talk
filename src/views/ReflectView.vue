<template>
  <div class="reflect-page">
    <main class="reflect-main">
      <nav class="reflect-nav" aria-label="Journal">
        <RouterLink to="/" class="reflect-nav__back">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Home
        </RouterLink>
      </nav>

      <section class="journal" aria-labelledby="journal-title">
        <div class="journal__header">
          <h1 id="journal-title">Conversation Journal</h1>
          <p>Reflect on real interactions and track your growth over time.</p>
        </div>

        <RouterLink to="/reflect/new" class="journal__new-btn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
          New Entry
        </RouterLink>

        <div v-if="loading" class="journal__empty">
          <p>Loading entries…</p>
        </div>

        <div v-else-if="entries.length === 0" class="journal__empty">
          <p>No entries yet.</p>
          <p>After a real conversation, come back and log how it went.</p>
        </div>

        <ul v-else-if="entries.length > 0" class="entry-list">
          <li v-for="entry in entries" :key="entry.id" class="entry-card">
            <div class="entry-card__header">
              <span class="entry-card__date">{{
                formatDate(entry.createdAt)
              }}</span>
              <span
                v-if="entry.sharedWithCounsellor"
                class="entry-card__shared-badge"
              >
                Shared
              </span>
            </div>

            <div class="entry-card__body">
              <div class="entry-card__field">
                <span class="entry-card__label">Situation</span>
                <p>{{ entry.situation }}</p>
              </div>
              <div class="entry-card__field">
                <span class="entry-card__label">What went well</span>
                <p>{{ entry.wentWell }}</p>
              </div>
              <div class="entry-card__field">
                <span class="entry-card__label">What was hard</span>
                <p>{{ entry.wasHard }}</p>
              </div>
              <div class="entry-card__field">
                <span class="entry-card__label">Next time</span>
                <p>{{ entry.doDifferently }}</p>
              </div>
            </div>

            <div class="entry-card__actions">
              <button class="entry-card__action" @click="toggleShare(entry.id)">
                {{
                  entry.sharedWithCounsellor
                    ? '✓ Shared with counsellor'
                    : 'Share with counsellor'
                }}
              </button>
              <button
                class="entry-card__action entry-card__action--delete"
                @click="deleteEntry(entry.id)"
              >
                Delete
              </button>
            </div>
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useJournal } from '@/composables/useJournal'

const { entries, loading, fetchEntries, deleteEntry, toggleShare } =
  useJournal()

onMounted(fetchEntries)

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<style scoped>
.reflect-page {
  min-height: 100svh;
  background: var(--color-bg);
}

.reflect-main {
  min-height: 100svh;
  padding: clamp(1rem, 4vw, 1.5rem) var(--space-page-x) 3rem;
}

.reflect-nav {
  width: 100%;
  max-width: var(--max-content);
  margin: 0 auto 1rem;
}

.reflect-nav__back {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
  color: var(--color-text-strong);
  text-decoration: none;
}

.reflect-nav__back svg {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.reflect-nav__back:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
  border-radius: 4px;
}

.journal {
  width: 100%;
  max-width: var(--max-content);
  margin-inline: auto;
}

.journal__header {
  display: grid;
  justify-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  text-align: center;
}

.journal__header h1 {
  font-size: clamp(2.25rem, 5vw, 2.5rem);
  font-weight: var(--font-weight-heading);
  line-height: 1.1;
  letter-spacing: 0;
  color: var(--color-text-strong);
}

.journal__header p {
  max-width: 38rem;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--color-text);
}

.journal__new-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto 2.5rem;
  padding: 0.625rem 1.5rem;
  border-radius: var(--radius-pill, 999px);
  background: var(--color-text-strong);
  color: #ffffff;
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
  text-decoration: none;
  transition: opacity 0.15s;
}

.journal__new-btn:hover {
  opacity: 0.85;
}

.journal__new-btn svg {
  width: 1.125rem;
  height: 1.125rem;
}

.journal__new-btn:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

.journal__empty {
  text-align: center;
  padding: 3rem 1rem;
  background: var(--color-surface-muted, #f5f5f0);
  border-radius: 1.25rem;
}

.journal__empty p {
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--color-text);
}

.journal__empty p:first-child {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-strong);
  margin-bottom: 0.5rem;
}

.entry-list {
  display: grid;
  gap: 1.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
  max-width: 40rem;
  margin-inline: auto;
}

.entry-card {
  padding: 1.5rem;
  background: #ffffff;
  border-radius: 1.25rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.entry-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-surface-muted, #eee);
}

.entry-card__date {
  font-size: 0.875rem;
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.entry-card__shared-badge {
  font-size: 0.75rem;
  font-weight: var(--font-weight-medium);
  padding: 0.2rem 0.75rem;
  border-radius: 999px;
  background: #e8f0eb;
  color: #2e7d4f;
}

.entry-card__body {
  display: grid;
  gap: 1rem;
}

.entry-card__field {
  display: grid;
  gap: 0.25rem;
}

.entry-card__label {
  font-size: 0.75rem;
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text);
}

.entry-card__field p {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: var(--color-text-strong);
}

.entry-card__actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-surface-muted, #eee);
}

.entry-card__action {
  padding: 0;
  border: none;
  background: none;
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.entry-card__action:hover {
  color: var(--color-text-strong);
}

.entry-card__action--delete:hover {
  color: #b3261e;
}

.entry-card__action:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
  border-radius: 4px;
}

@media (max-width: 37.5rem) {
  .entry-card {
    padding: 1.25rem;
  }
}
</style>
