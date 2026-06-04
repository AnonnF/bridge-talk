<template>
  <div class="reflect-new-page">
    <header class="reflect-new-header">
      <div class="reflect-new-header__top">
        <RouterLink to="/reflect" class="reflect-new-header__back">
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
          Back
        </RouterLink>

        <RouterLink to="/" class="reflect-new-header__logo"
          >BridgeTalk</RouterLink
        >

        <span class="reflect-new-header__spacer" aria-hidden="true" />
      </div>

      <div class="reflect-new-header__progress">
        <div
          class="reflect-new-header__progress-track"
          role="progressbar"
          :aria-valuenow="step"
          :aria-valuemin="1"
          :aria-valuemax="4"
          :aria-label="`Step ${step} of 4`"
        >
          <div
            class="reflect-new-header__progress-fill"
            :style="{ width: `${(step / 4) * 100}%` }"
          />
        </div>
        <p class="reflect-new-header__progress-label">Step {{ step }} of 4</p>
      </div>
    </header>

    <main class="reflect-new-main">
      <section class="reflect-new-content">
        <div class="reflect-new-badge">
          <span class="reflect-new-badge__icon" aria-hidden="true">📓</span>
          <span class="reflect-new-badge__label">New Journal Entry</span>
        </div>

        <h1 class="reflect-new-content__prompt">
          {{ prompts[step - 1].label }}
        </h1>

        <textarea
          v-model="answers[step - 1]"
          class="reflect-new-content__textarea"
          :placeholder="prompts[step - 1].placeholder"
          rows="5"
        />
      </section>
    </main>

    <footer class="reflect-new-footer">
      <div class="reflect-new-footer__actions">
        <button
          type="button"
          class="reflect-new-footer__prev"
          :disabled="step === 1"
          @click="step--"
        >
          Previous
        </button>

        <button
          v-if="step < 4"
          type="button"
          class="reflect-new-footer__next"
          :disabled="!answers[step - 1]"
          @click="step++"
        >
          Next
        </button>

        <button
          v-else
          type="button"
          class="reflect-new-footer__next"
          :disabled="!answers[3]"
          @click="submit"
        >
          Save Entry
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useJournal } from '@/composables/useJournal'

const router = useRouter()
const { addEntry } = useJournal()

const step = ref(1)
const answers = ref(['', '', '', ''])

const prompts = [
  {
    label: 'What was the situation?',
    placeholder: 'e.g. I needed to ask my tutor for help after a lecture...',
  },
  {
    label: 'What went well?',
    placeholder: 'e.g. I managed to approach them before they left...',
  },
  {
    label: 'What was hard?',
    placeholder: 'e.g. I froze when they asked a follow-up question...',
  },
  {
    label: 'What would I do differently?',
    placeholder: 'e.g. Prepare one specific question in advance...',
  },
]

async function submit() {
  await addEntry({
    situation: answers.value[0],
    wentWell: answers.value[1],
    wasHard: answers.value[2],
    doDifferently: answers.value[3],
  })
  router.push('/reflect')
}
</script>

<style scoped>
.reflect-new-page {
  display: flex;
  flex-direction: column;
  min-height: 100svh;
  background: var(--color-bg);
}

.reflect-new-header {
  width: 100%;
  max-width: 56rem;
  margin-inline: auto;
  padding: 1.5rem var(--space-page-x) 1rem;
}

.reflect-new-header__top {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  margin-bottom: 1.25rem;
}

.reflect-new-header__back {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  justify-self: start;
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
  color: var(--color-text-strong);
  text-decoration: none;
}

.reflect-new-header__back svg {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.reflect-new-header__back:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
  border-radius: 4px;
}

.reflect-new-header__logo {
  justify-self: center;
  font-family: var(--font-logo);
  font-size: var(--text-logo);
  font-weight: 400;
  line-height: 1.75rem;
  color: var(--color-text-strong);
  text-decoration: none;
}

.reflect-new-header__logo:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
  border-radius: 4px;
}

.reflect-new-header__spacer {
  justify-self: end;
  width: 4.5rem;
}

.reflect-new-header__progress {
  display: grid;
  gap: 0.625rem;
}

.reflect-new-header__progress-track {
  height: 0.375rem;
  overflow: hidden;
  background: var(--color-surface-muted);
  border-radius: var(--radius-pill);
}

.reflect-new-header__progress-fill {
  height: 100%;
  background: var(--color-text-strong);
  border-radius: var(--radius-pill);
  transition: width 0.25s ease;
}

.reflect-new-header__progress-label {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-text);
  text-align: center;
}

.reflect-new-main {
  flex: 1;
  width: 100%;
  max-width: 56rem;
  margin-inline: auto;
  padding: 0 var(--space-page-x) 1.5rem;
}

.reflect-new-content {
  width: 100%;
  max-width: 48rem;
  margin-inline: auto;
  display: grid;
  gap: 1.5rem;
}

.reflect-new-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  width: fit-content;
  padding: 0.375rem 0.875rem 0.375rem 0.625rem;
  background: var(--color-surface-muted);
  border-radius: var(--radius-pill);
}

.reflect-new-badge__icon {
  display: grid;
  place-items: center;
  width: 1.25rem;
  height: 1.25rem;
  font-size: 0.875rem;
}

.reflect-new-badge__label {
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
  color: var(--color-badge-text);
}

.reflect-new-content__prompt {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 2.25rem;
  font-weight: var(--font-weight-heading);
  line-height: 1.25;
  color: var(--color-text-strong);
}

.reflect-new-content__textarea {
  width: 100%;
  min-height: 10rem;
  padding: 1.125rem 1.25rem;
  border: none;
  border-radius: 1.25rem;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  font-family: var(--font-sans);
  font-size: 1rem;
  line-height: 1.6;
  color: var(--color-text-strong);
  resize: vertical;
}

.reflect-new-content__textarea::placeholder {
  color: var(--color-text);
  opacity: 0.6;
}

.reflect-new-content__textarea:focus {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

.reflect-new-footer {
  width: 100%;
  max-width: 56rem;
  margin-inline: auto;
  padding: 1rem var(--space-page-x) 1.5rem;
  border-top: 1px solid var(--color-surface-muted);
}

.reflect-new-footer__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.reflect-new-footer__prev {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5625rem 1.25rem;
  border: 1px solid var(--color-text-strong);
  border-radius: var(--radius-pill, 999px);
  background: transparent;
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
  color: var(--color-text-strong);
  cursor: pointer;
}

.reflect-new-footer__prev:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

.reflect-new-footer__prev:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reflect-new-footer__next {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.5rem;
  border: none;
  border-radius: var(--radius-pill, 999px);
  background: var(--color-text-strong);
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
  color: #ffffff;
  cursor: pointer;
  transition: opacity 0.15s;
}

.reflect-new-footer__next:hover {
  opacity: 0.85;
}

.reflect-new-footer__next:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

.reflect-new-footer__next:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 37.5rem) {
  .reflect-new-content__prompt {
    font-size: clamp(1.75rem, 7vw, 2.25rem);
  }

  .reflect-new-footer__actions {
    flex-direction: column-reverse;
    width: 100%;
  }

  .reflect-new-footer__prev,
  .reflect-new-footer__next {
    width: 100%;
  }
}
</style>
