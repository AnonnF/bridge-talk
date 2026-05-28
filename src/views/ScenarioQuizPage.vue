<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import BaseButton from '../components/ui/BaseButton.vue'
import {
  getScenarioQuestions,
  getScenarios,
  submitQuiz,
} from '../services/questionBankApi'
import type { QuizQuestion, SubmitResponse } from '../types/questionBank'

const route = useRoute()
const scenarioId = computed(() => String(route.params.scenarioId))

const scenarioTitle = ref('')
const questions = ref<QuizQuestion[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const currentIndex = ref(0)
const selectedByQuestionId = ref<Record<string, string>>({})
const submitting = ref(false)
const results = ref<SubmitResponse | null>(null)

const currentQuestion = computed(
  () => questions.value[currentIndex.value] ?? null,
)

const currentSelection = computed(() => {
  const question = currentQuestion.value
  if (!question) {
    return ''
  }
  return selectedByQuestionId.value[question.id] ?? ''
})

const isLastQuestion = computed(
  () => currentIndex.value === questions.value.length - 1,
)

const canAdvance = computed(() => currentSelection.value !== '')

const progressPercent = computed(() => {
  if (questions.value.length === 0) {
    return '0%'
  }
  return `${((currentIndex.value + 1) / questions.value.length) * 100}%`
})

const showQuiz = computed(
  () => !loading.value && !results.value && currentQuestion.value !== null,
)

onMounted(async () => {
  try {
    const [scenarios, questionsResponse] = await Promise.all([
      getScenarios(),
      getScenarioQuestions(scenarioId.value),
    ])

    scenarioTitle.value =
      scenarios.find((scenario) => scenario.id === scenarioId.value)?.title ??
      ''
    questions.value = questionsResponse.questions

    if (questions.value.length === 0) {
      error.value = 'This scenario has no questions yet.'
    }
  } catch {
    error.value =
      'Could not load questions. Start the API with npm run dev:api or npm run dev:full.'
  } finally {
    loading.value = false
  }
})

function selectOption(optionId: string) {
  const question = currentQuestion.value
  if (!question) {
    return
  }
  selectedByQuestionId.value = {
    ...selectedByQuestionId.value,
    [question.id]: optionId,
  }
}

function goToPrevious() {
  if (currentIndex.value > 0) {
    currentIndex.value -= 1
  }
}

function handleNotSure() {
  const question = currentQuestion.value
  if (!question) {
    return
  }

  const nextSelections = { ...selectedByQuestionId.value }
  delete nextSelections[question.id]
  selectedByQuestionId.value = nextSelections

  if (!isLastQuestion.value) {
    currentIndex.value += 1
  }
}

async function handleCheckAnswer() {
  if (!canAdvance.value || submitting.value) {
    return
  }

  if (!isLastQuestion.value) {
    currentIndex.value += 1
    return
  }

  submitting.value = true
  error.value = null

  try {
    const answers = questions.value.map((question) => ({
      questionId: question.id,
      selectedOptionId: selectedByQuestionId.value[question.id] ?? '',
    }))
    results.value = await submitQuiz(scenarioId.value, answers)
  } catch {
    error.value = 'Could not submit your answers. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="quiz-page">
    <header v-if="showQuiz" class="quiz-header">
      <div class="quiz-header__top">
        <RouterLink to="/practice" class="quiz-header__back">
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

        <RouterLink to="/" class="quiz-header__logo">BridgeTalk</RouterLink>

        <span class="quiz-header__spacer" aria-hidden="true" />
      </div>

      <div class="quiz-header__progress">
        <div
          class="quiz-header__progress-track"
          role="progressbar"
          :aria-valuenow="currentIndex + 1"
          :aria-valuemin="1"
          :aria-valuemax="questions.length"
          :aria-label="`Question ${currentIndex + 1} of ${questions.length}`"
        >
          <div
            class="quiz-header__progress-fill"
            :style="{ width: progressPercent }"
          />
        </div>
        <p class="quiz-header__progress-label">
          Question {{ currentIndex + 1 }} of {{ questions.length }}
        </p>
      </div>
    </header>

    <main class="quiz-main">
      <p v-if="loading" class="quiz-status" role="status">Loading quiz…</p>

      <p
        v-else-if="error && !results"
        class="quiz-status quiz-status--error"
        role="alert"
      >
        {{ error }}
      </p>

      <section
        v-else-if="results"
        class="quiz-results"
        aria-labelledby="quiz-results-title"
      >
        <h1 id="quiz-results-title">Your results</h1>
        <p class="quiz-results__score">
          You scored {{ results.score }} / {{ results.total }}
        </p>

        <ul class="quiz-results__list">
          <li
            v-for="item in results.results"
            :key="item.questionId"
            class="quiz-results__item"
            :class="item.correct ? 'is-correct' : 'is-incorrect'"
          >
            <p class="quiz-results__verdict">
              {{ item.correct ? 'Correct' : 'Incorrect' }}
            </p>
            <p class="quiz-results__explanation">{{ item.explanation }}</p>
          </li>
        </ul>

        <BaseButton to="/practice" size="sm">Back to practice</BaseButton>
      </section>

      <section
        v-else-if="currentQuestion"
        class="quiz-content"
        aria-labelledby="quiz-question-title"
      >
        <div class="quiz-badge">
          <span class="quiz-badge__icon" aria-hidden="true">
            <svg
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
          <span class="quiz-badge__label">{{ scenarioTitle }}</span>
        </div>

        <h1 id="quiz-question-title" class="quiz-content__prompt">
          {{ currentQuestion.prompt }}
        </h1>

        <fieldset class="quiz-options">
          <legend class="visually-hidden">Choose an answer</legend>
          <label
            v-for="option in currentQuestion.options"
            :key="option.id"
            class="quiz-option"
            :class="{ 'is-selected': currentSelection === option.id }"
          >
            <input
              type="radio"
              :name="currentQuestion.id"
              :value="option.id"
              :checked="currentSelection === option.id"
              @change="selectOption(option.id)"
            />
            <span class="quiz-option__radio" aria-hidden="true">
              <span
                v-if="currentSelection === option.id"
                class="quiz-option__radio-dot"
              />
            </span>
            <span class="quiz-option__text">{{ option.text }}</span>
          </label>
        </fieldset>

        <p v-if="error" class="quiz-status quiz-status--error" role="alert">
          {{ error }}
        </p>
      </section>

      <BaseButton v-else to="/practice" size="sm">Back to practice</BaseButton>
    </main>

    <footer v-if="showQuiz" class="quiz-footer">
      <button type="button" class="quiz-footer__unsure" @click="handleNotSure">
        I'm not sure
      </button>

      <div class="quiz-footer__actions">
        <button
          type="button"
          class="quiz-footer__prev"
          :disabled="currentIndex === 0"
          @click="goToPrevious"
        >
          Previous
        </button>

        <BaseButton
          size="sm"
          :class="{ 'is-disabled': !canAdvance || submitting }"
          @click="handleCheckAnswer"
        >
          {{ submitting ? 'Submitting…' : 'Check Answer' }}
        </BaseButton>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.quiz-page {
  display: flex;
  flex-direction: column;
  min-height: 100svh;
  background: var(--color-bg);
}

.quiz-header {
  width: 100%;
  max-width: 56rem;
  margin-inline: auto;
  padding: 1.5rem var(--space-page-x) 1rem;
}

.quiz-header__top {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  margin-bottom: 1.25rem;
}

.quiz-header__back {
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

.quiz-header__back svg {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.quiz-header__back:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
  border-radius: 4px;
}

.quiz-header__logo {
  justify-self: center;
  font-family: var(--font-logo);
  font-size: var(--text-logo);
  font-weight: 400;
  line-height: 1.75rem;
  color: var(--color-text-strong);
  text-decoration: none;
}

.quiz-header__logo:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
  border-radius: 4px;
}

.quiz-header__spacer {
  justify-self: end;
  width: 4.5rem;
}

.quiz-header__progress {
  display: grid;
  gap: 0.625rem;
}

.quiz-header__progress-track {
  height: 0.375rem;
  overflow: hidden;
  background: var(--color-surface-muted);
  border-radius: var(--radius-pill);
}

.quiz-header__progress-fill {
  height: 100%;
  background: var(--color-text-strong);
  border-radius: var(--radius-pill);
  transition: width 0.25s ease;
}

.quiz-header__progress-label {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-text);
  text-align: center;
}

.quiz-main {
  flex: 1;
  width: 100%;
  max-width: 56rem;
  margin-inline: auto;
  padding: 0 var(--space-page-x) 1.5rem;
}

.quiz-content {
  width: 100%;
  max-width: 48rem;
  margin-inline: auto;
  display: grid;
  gap: 1.5rem;
}

.quiz-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  width: fit-content;
  padding: 0.375rem 0.875rem 0.375rem 0.625rem;
  background: var(--color-surface-muted);
  border-radius: var(--radius-pill);
}

.quiz-badge__icon {
  display: grid;
  place-items: center;
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-badge-text);
}

.quiz-badge__icon svg {
  width: 1.125rem;
  height: 1.125rem;
}

.quiz-badge__label {
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
  color: var(--color-badge-text);
}

.quiz-content__prompt {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 2.25rem;
  font-weight: var(--font-weight-heading);
  line-height: 1.25;
  color: var(--color-text-strong);
}

.quiz-options {
  margin: 0;
  padding: 0;
  border: none;
  display: grid;
  gap: 0.75rem;
}

.quiz-option {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 1.125rem 1.25rem;
  border-radius: 1.5rem;
  background: #ffffff;
  box-shadow: var(--color-option-shadow);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: 1rem;
  line-height: 1.5;
  color: var(--color-text-strong);
}

.quiz-option:focus-within {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

.quiz-option input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.quiz-option__radio {
  display: grid;
  place-items: center;
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0.125rem;
  flex-shrink: 0;
  border: 2px solid var(--color-radio-border);
  border-radius: 50%;
}

.quiz-option.is-selected .quiz-option__radio {
  border-color: var(--color-text-strong);
}

.quiz-option__radio-dot {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 50%;
  background: var(--color-text-strong);
}

.quiz-option__text {
  flex: 1;
}

.quiz-footer {
  width: 100%;
  max-width: 56rem;
  margin-inline: auto;
  padding: 1rem var(--space-page-x) 1.5rem;
  border-top: 1px solid var(--color-surface-muted);
}

.quiz-footer__unsure {
  display: block;
  width: fit-content;
  margin: 0 auto 1rem;
  padding: 0;
  border: none;
  background: none;
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
  color: var(--color-text);
  text-decoration: underline;
  cursor: pointer;
}

.quiz-footer__unsure:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
  border-radius: 4px;
}

.quiz-footer__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.quiz-footer__prev {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5625rem 1.25rem;
  border: 1px solid var(--color-text-strong);
  border-radius: var(--radius-pill);
  background: transparent;
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
  color: var(--color-text-strong);
  cursor: pointer;
}

.quiz-footer__prev:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

.quiz-footer__prev:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quiz-footer__actions :deep(.is-disabled) {
  opacity: 0.5;
  pointer-events: none;
}

.quiz-status {
  margin: 0;
  text-align: center;
  font-family: var(--font-sans);
  font-size: 1rem;
  line-height: 1.5;
  color: var(--color-text);
}

.quiz-status--error {
  color: var(--color-text-strong);
}

.quiz-results {
  width: 100%;
  max-width: 48rem;
  margin-inline: auto;
  display: grid;
  gap: 1.5rem;
}

.quiz-results h1 {
  margin: 0;
  font-family: var(--font-sans);
  font-size: clamp(1.75rem, 4vw, 2rem);
  font-weight: var(--font-weight-heading);
  color: var(--color-text-strong);
}

.quiz-results__score {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 1.125rem;
  color: var(--color-text);
}

.quiz-results__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 1rem;
}

.quiz-results__item {
  padding: 1rem 1.125rem;
  border-radius: 1rem;
  background: rgb(255 255 255 / 0.7);
}

.quiz-results__item.is-correct {
  border-left: 4px solid #2e7d4f;
}

.quiz-results__item.is-incorrect {
  border-left: 4px solid #b3261e;
}

.quiz-results__verdict {
  margin: 0 0 0.5rem;
  font-family: var(--font-sans);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-strong);
}

.quiz-results__explanation {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  line-height: 1.55;
  color: var(--color-text);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 37.5rem) {
  .quiz-content__prompt {
    font-size: clamp(1.75rem, 7vw, 2.25rem);
  }

  .quiz-footer__actions {
    flex-direction: column-reverse;
    width: 100%;
  }

  .quiz-footer__prev,
  .quiz-footer__actions :deep(.btn) {
    width: 100%;
  }
}
</style>
