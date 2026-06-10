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
      <h2 id="profile-scores-title" class="communication-profile__scores-title">
        Your dimensions
      </h2>
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
          <p class="dimension-scores__description">
            {{ DIMENSION_DESCRIPTIONS[key] }}
          </p>
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

.dimension-scores__description {
  margin: -0.125rem 0 0.5rem;
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  line-height: 1.45;
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
