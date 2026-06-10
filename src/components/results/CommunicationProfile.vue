<script setup lang="ts">
import { computed } from 'vue'
import {
  DIMENSION_DESCRIPTIONS,
  DIMENSION_LABELS,
  getScoreBand,
  type DimensionKey,
  type ScenarioResultResponse,
} from '../../types/questionBank'
import DimensionRadarChart from './DimensionRadarChart.vue'

const props = defineProps<{
  result: ScenarioResultResponse
}>()

const dimensionKeys = Object.keys(DIMENSION_LABELS) as DimensionKey[]
const maxScore = 5

const overallScore = computed(() => {
  const scores = Object.values(props.result.averages) as number[]
  return scores.reduce((sum, score) => sum + score, 0) / scores.length
})

const profileInterpretation = computed(
  () =>
    `Your profile is currently ${scoreLabel(overallScore.value).toLowerCase()} overall, with ${props.result.strongestLabel} as a strength and ${props.result.weakestLabel} as the main area to develop.`,
)

function scoreLabel(score: number): string {
  return getScoreBand(score).label
}
</script>

<template>
  <div class="communication-profile">
    <section
      class="communication-profile__overall"
      aria-labelledby="profile-overall-title"
    >
      <div>
        <h2 id="profile-overall-title">Overall score</h2>
        <p>
          Average across clarity, empathy, appropriateness, confidence, and
          safety.
        </p>
        <p class="communication-profile__interpretation">
          {{ profileInterpretation }}
        </p>
      </div>
      <div class="communication-profile__overall-score">
        <span class="communication-profile__overall-value">
          {{ overallScore.toFixed(1) }}
        </span>
        <span class="communication-profile__overall-max">/ {{ maxScore }}</span>
        <span class="communication-profile__overall-label">
          {{ scoreLabel(overallScore) }}
        </span>
      </div>
    </section>

    <DimensionRadarChart :scores="result.averages" :max-score="maxScore" />

    <section
      class="communication-profile__scores"
      aria-labelledby="profile-scores-title"
    >
      <div class="communication-profile__scores-heading">
        <h2
          id="profile-scores-title"
          class="communication-profile__scores-title"
        >
          Your dimensions
        </h2>
        <div class="dimension-help">
          <button
            class="dimension-help__button"
            type="button"
            aria-label="Show dimension descriptions"
          >
            ?
          </button>
          <dl class="dimension-help__panel">
            <div
              v-for="key in dimensionKeys"
              :key="key"
              class="dimension-help__item"
            >
              <dt>{{ DIMENSION_LABELS[key] }}</dt>
              <dd>{{ DIMENSION_DESCRIPTIONS[key] }}</dd>
            </div>
          </dl>
        </div>
      </div>
      <ul class="dimension-scores">
        <li
          v-for="key in dimensionKeys"
          :key="key"
          class="dimension-scores__item"
        >
          <div class="dimension-scores__header">
            <span class="dimension-scores__label">{{
              DIMENSION_LABELS[key]
            }}</span>
            <span class="dimension-scores__value">
              {{ result.averages[key] }} / {{ maxScore }} -
              {{ scoreLabel(result.averages[key]) }}
            </span>
          </div>
          <div
            class="dimension-scores__track"
            role="meter"
            :aria-valuenow="result.averages[key]"
            :aria-valuemin="0"
            :aria-valuemax="maxScore"
            :aria-label="`${DIMENSION_LABELS[key]} score: ${result.averages[key]} out of ${maxScore}, ${scoreLabel(result.averages[key])}`"
          >
            <div
              class="dimension-scores__fill"
              :style="{ width: `${(result.averages[key] / maxScore) * 100}%` }"
            />
          </div>
        </li>
      </ul>
    </section>

    <p class="communication-profile__highlights">
      <span> <strong>Strongest:</strong> {{ result.strongestLabel }} </span>
      <span> <strong>Weakest:</strong> {{ result.weakestLabel }} </span>
    </p>

    <section
      class="communication-profile__summary"
      aria-labelledby="profile-summary-title"
    >
      <h2 id="profile-summary-title">Summary</h2>
      <p>{{ result.summary }}</p>
    </section>

    <section
      class="communication-profile__suggestions"
      aria-labelledby="profile-suggestions-title"
    >
      <h2 id="profile-suggestions-title">Suggestions</h2>
      <ul>
        <li v-for="(suggestion, index) in result.suggestions" :key="index">
          {{ suggestion }}
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.communication-profile {
  display: grid;
  gap: 1.5rem;
}

.communication-profile__overall {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.125rem;
  border-radius: 1rem;
  background: rgb(255 255 255 / 0.7);
  font-family: var(--font-sans);
}

.communication-profile__overall h2 {
  margin: 0 0 0.25rem;
  font-size: 0.875rem;
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
  color: var(--color-text);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.communication-profile__overall p {
  margin: 0;
  max-width: 28rem;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: var(--color-text);
}

.communication-profile__interpretation {
  margin-top: 0.5rem !important;
  color: var(--color-text-strong) !important;
}

.communication-profile__overall-score {
  display: grid;
  justify-items: end;
  gap: 0.25rem;
  flex-shrink: 0;
}

.communication-profile__overall-value {
  font-size: 1.75rem;
  font-weight: var(--font-weight-heading);
  line-height: 1;
  color: var(--color-text-strong);
}

.communication-profile__overall-max {
  font-size: 0.875rem;
  color: var(--color-text);
}

.communication-profile__overall-label {
  font-size: 0.75rem;
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.communication-profile__scores-title,
.communication-profile__summary h2,
.communication-profile__suggestions h2 {
  margin: 0 0 0.75rem;
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
  color: var(--color-text);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.communication-profile__scores-heading {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.communication-profile__scores-heading .communication-profile__scores-title {
  margin: 0;
}

.dimension-help {
  position: relative;
}

.dimension-help__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  padding: 0;
  border: 1px solid var(--color-radio-border);
  border-radius: 50%;
  background: #fff;
  color: var(--color-text-strong);
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: var(--font-weight-medium);
  line-height: 1.25rem;
  text-align: center;
  cursor: help;
}

.dimension-help__button:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

.dimension-help__panel {
  position: absolute;
  top: 1.625rem;
  left: 0;
  z-index: 2;
  display: grid;
  width: min(18rem, calc(100vw - 3rem));
  gap: 0.5rem;
  margin: 0;
  padding: 0.875rem;
  border: 1px solid var(--color-surface-muted);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 24px rgb(0 0 0 / 0.12);
  opacity: 0;
  pointer-events: none;
  transform: translateY(-0.25rem);
  transition:
    opacity 0.15s,
    transform 0.15s;
}

.dimension-help:hover .dimension-help__panel,
.dimension-help:focus-within .dimension-help__panel {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.dimension-help__item {
  display: grid;
  grid-template-columns: 6.5rem minmax(0, 1fr);
  align-items: baseline;
  gap: 0.5rem;
}

.dimension-help dt {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-strong);
}

.dimension-help dd {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 0.75rem;
  line-height: 1.45;
  color: var(--color-text);
}

.dimension-scores {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.875rem;
}

.dimension-scores__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  margin-bottom: 0.375rem;
}

.dimension-scores__label {
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-strong);
}

.dimension-scores__value {
  font-family: var(--font-sans);
  font-size: 0.875rem;
  color: var(--color-text);
}

.dimension-scores__track {
  height: 0.5rem;
  overflow: hidden;
  background: var(--color-surface-muted);
  border-radius: var(--radius-pill);
}

.dimension-scores__fill {
  height: 100%;
  background: var(--color-text-strong);
  border-radius: var(--radius-pill);
  transition: width 0.35s ease;
}

.communication-profile__highlights {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.5rem;
  margin: 0;
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  line-height: 1.5;
  color: var(--color-text);
}

.communication-profile__highlights strong {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-strong);
}

.communication-profile__summary,
.communication-profile__suggestions {
  padding: 1rem 1.125rem;
  border-radius: 1rem;
  background: rgb(255 255 255 / 0.7);
  font-family: var(--font-sans);
}

.communication-profile__summary p,
.communication-profile__suggestions ul {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: var(--color-text);
}

.communication-profile__suggestions ul {
  padding-left: 1.125rem;
  display: grid;
  gap: 0.5rem;
}

@media (max-width: 37.5rem) {
  .communication-profile__overall {
    flex-direction: column;
  }

  .communication-profile__overall-score {
    justify-items: start;
  }
}
</style>
