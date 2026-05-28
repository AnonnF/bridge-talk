<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getScenarios } from '../services/questionBankApi'
import type { ScenarioSummary } from '../types/questionBank'

const scenarios = ref<ScenarioSummary[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    scenarios.value = await getScenarios()
  } catch {
    error.value =
      'Could not load scenarios. Check that the API is running and try again.'
  } finally {
    loading.value = false
  }
})

function formatLevel(level: ScenarioSummary['level']): string {
  return level.charAt(0).toUpperCase() + level.slice(1)
}

function formatQuestionCount(count: number): string {
  return count === 1 ? '1 Question' : `${count} Questions`
}
</script>

<template>
  <div class="practice-page">
    <main class="practice-main">
      <section class="question-bank" aria-labelledby="question-bank-title">
        <div class="question-bank__header">
          <h1 id="question-bank-title">Practice Question Bank</h1>
          <p>
            Choose a real-life scenario and practise what to say step by step.
          </p>
        </div>

        <p v-if="loading" class="question-bank__status" role="status">
          Loading scenarios…
        </p>

        <p
          v-else-if="error"
          class="question-bank__status question-bank__status--error"
          role="alert"
        >
          {{ error }}
        </p>

        <p
          v-else-if="scenarios.length === 0"
          class="question-bank__status"
          role="status"
        >
          No scenarios available yet.
        </p>

        <ul v-else class="scenario-list">
          <li v-for="scenario in scenarios" :key="scenario.id">
            <RouterLink
              :to="`/practice/${scenario.id}`"
              :class="['scenario-card', `scenario-card--${scenario.id}`]"
            >
              <span class="scenario-card__icon" aria-hidden="true">
                <svg
                  v-if="scenario.id === 'ordering-food'"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M7 2v20"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M21 15v7"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>

                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M6 3v5a5 5 0 0 0 10 0V3"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M9 3H5"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                  <path
                    d="M17 3h-4"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                  <path
                    d="M11 13v2.5A4.5 4.5 0 0 0 15.5 20H16"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <circle
                    cx="18"
                    cy="20"
                    r="2"
                    stroke="currentColor"
                    stroke-width="2"
                  />
                </svg>
              </span>

              <span class="scenario-card__content">
                <span class="scenario-card__title">{{ scenario.title }}</span>
                <span class="scenario-card__description">
                  {{ scenario.description }}
                </span>
              </span>

              <span class="scenario-card__meta">
                <span class="scenario-card__level">
                  <svg
                    :class="[
                      'scenario-card__level-icon',
                      `scenario-card__level-icon--${scenario.level}`,
                    ]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      class="scenario-card__level-bar scenario-card__level-bar--one"
                      d="M3 13V9"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                    <path
                      class="scenario-card__level-bar scenario-card__level-bar--two"
                      d="M8 13V6"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                    <path
                      class="scenario-card__level-bar scenario-card__level-bar--three"
                      d="M13 13V3"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                  </svg>
                  {{ formatLevel(scenario.level) }}
                </span>
                <span>{{ formatQuestionCount(scenario.questionCount) }}</span>
              </span>
            </RouterLink>
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>

<style scoped>
.practice-page {
  min-height: 100svh;
  background: var(--color-bg);
}

.practice-main {
  min-height: 100svh;
  padding: clamp(1rem, 4vw, 1.5rem) var(--space-page-x) 1rem;
}

.question-bank {
  width: 100%;
  max-width: var(--max-content);
  margin-inline: auto;
}

.question-bank__header {
  display: grid;
  justify-items: center;
  gap: 1rem;
  margin-bottom: clamp(2.375rem, 7vw, 2.75rem);
  text-align: center;
}

.question-bank__header h1 {
  font-size: clamp(2.25rem, 5vw, 2.5rem);
  font-weight: var(--font-weight-heading);
  line-height: 1.1;
  letter-spacing: 0;
}

.question-bank__header p {
  max-width: 38rem;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--color-text);
}

.question-bank__status {
  margin: 0;
  text-align: center;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--color-text);
}

.question-bank__status--error {
  color: var(--color-text-strong);
}

.scenario-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(17.25rem, 1fr));
  gap: 1.5rem;
  justify-items: center;
  margin: 0;
  padding: 0;
  list-style: none;
}

.scenario-card {
  display: grid;
  grid-template-rows: auto 1fr auto;
  width: min(100%, 17.25rem);
  min-height: 16.4375rem;
  padding: 1.5625rem 1.5rem 1.5rem;
  color: var(--color-text);
  text-decoration: none;
  background: #d6ecfb;
  border-radius: 1.25rem;
}

.scenario-card--ordering-food {
  background: #ffe8cc;
}

.scenario-card:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

.scenario-card__icon {
  display: grid;
  place-items: center;
  width: 3.125rem;
  height: 3.125rem;
  color: var(--color-text-strong);
  background: rgb(255 255 255 / 0.6);
  border-radius: 1rem;
}

.scenario-card--ordering-food .scenario-card__icon {
  color: #7a4300;
}

.scenario-card__icon svg {
  width: 1.5rem;
  height: 1.5rem;
}

.scenario-card__content {
  display: grid;
  align-content: end;
  gap: 0.75rem;
  padding-bottom: 1.5625rem;
}

.scenario-card__title {
  font-size: 1.125rem;
  font-weight: var(--font-weight-heading);
  line-height: 1.3;
  color: var(--color-text-strong);
}

.scenario-card__description,
.scenario-card__meta {
  font-size: 0.75rem;
  line-height: 1.55;
}

.scenario-card__description {
  max-width: 13.25rem;
}

.scenario-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 0.875rem;
  border-top: 1px solid rgb(61 69 65 / 0.1);
}

.scenario-card__level {
  display: inline-flex;
  align-items: center;
  gap: 0.4375rem;
}

.scenario-card__level-icon {
  width: 0.8125rem;
  height: 0.8125rem;
  flex-shrink: 0;
}

.scenario-card__level-bar {
  opacity: 0.28;
}

.scenario-card__level-icon--beginner .scenario-card__level-bar--one,
.scenario-card__level-icon--intermediate .scenario-card__level-bar--one,
.scenario-card__level-icon--intermediate .scenario-card__level-bar--two,
.scenario-card__level-icon--advanced .scenario-card__level-bar {
  opacity: 1;
}

@media (max-width: 37.5rem) {
  .practice-main {
    padding-top: 1.5rem;
  }
}
</style>
