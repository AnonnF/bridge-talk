<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  DIMENSION_LABELS,
  formatScore,
  getScoreBand,
  SCORE_BANDS,
  scoreBandRangeLabel,
  type DimensionKey,
} from '@/types/questionBank'

interface Attempt {
  completedAt: string
  scores: Record<DimensionKey, number>
}

interface ScenarioProgress {
  id: string
  title: string
  attempts: Attempt[]
  latestAvg: number
}

const props = defineProps<{
  scenarios: ScenarioProgress[]
  visible: Set<string>
}>()

const COLORS = [
  '#5a8a72',
  '#a0685a',
  '#8a7a42',
  '#5a6a8a',
  '#8a6a9a',
  '#6a8a5a',
  '#a07848',
]

const DIMENSION_ENTRIES = Object.entries(DIMENSION_LABELS) as [
  DimensionKey,
  string,
][]

function colorFor(index: number): string {
  return COLORS[index % COLORS.length]
}

function avgScore(attempt: Attempt): number {
  const vals = Object.values(attempt.scores) as number[]
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

const W = 480
const H = 176
const PAD = { top: 12, right: 112, bottom: 44, left: 44 }
const chartW = W - PAD.left - PAD.right
const chartH = H - PAD.top - PAD.bottom
const popoverWidth = 198
const popoverHeight = 108
const activePoint = ref<{ scenarioId: string; attemptIndex: number } | null>(
  null,
)

const visibleScenarios = computed(() =>
  props.scenarios.filter((s) => props.visible.has(s.id)),
)

const maxAttempts = computed(() =>
  Math.max(...visibleScenarios.value.map((s) => s.attempts.length), 2),
)

function xPos(attemptIndex: number): number {
  const n = maxAttempts.value
  if (n === 1) return PAD.left + chartW / 2
  return PAD.left + (attemptIndex / (n - 1)) * chartW
}

function yPos(score: number): number {
  return PAD.top + ((5 - score) / 5) * chartH
}

function polyline(scenario: ScenarioProgress): string {
  return scenario.attempts
    .map((a, i) => `${xPos(i)},${yPos(avgScore(a))}`)
    .join(' ')
}

function scoreLabel(score: number): string {
  return getScoreBand(score).label
}

function latestAttempt(scenario: ScenarioProgress): Attempt | null {
  return scenario.attempts[scenario.attempts.length - 1] ?? null
}

function latestX(scenario: ScenarioProgress): number {
  return xPos(Math.max(scenario.attempts.length - 1, 0))
}

function latestY(scenario: ScenarioProgress): number {
  const latest = latestAttempt(scenario)
  return latest ? yPos(avgScore(latest)) : PAD.top + chartH
}

function popoverX(attemptIndex: number): number {
  return Math.min(Math.max(xPos(attemptIndex) + 8, 4), W - popoverWidth - 4)
}

function popoverY(score: number): number {
  return Math.min(
    Math.max(yPos(score) - popoverHeight, 4),
    H - popoverHeight - 4,
  )
}

function isActivePoint(scenarioId: string, attemptIndex: number): boolean {
  return (
    activePoint.value?.scenarioId === scenarioId &&
    activePoint.value.attemptIndex === attemptIndex
  )
}

const yGridLines = [0, 1, 2, 3, 4, 5]

const xLabels = computed(() => {
  const n = maxAttempts.value
  if (n <= 5) return Array.from({ length: n }, (_, i) => i + 1)
  const step = (n - 1) / 4
  return [0, 1, 2, 3, 4].map((i) => Math.round(i * step) + 1)
})

const chartDescription = computed(() =>
  visibleScenarios.value
    .map(
      (scenario) =>
        `${scenario.title} latest overall score ${formatScore(scenario.latestAvg)} out of 5, ${scoreLabel(scenario.latestAvg)}`,
    )
    .join('; '),
)
</script>

<template>
  <div class="combined-chart">
    <svg
      :viewBox="`0 0 ${W} ${H}`"
      class="chart-svg"
      role="img"
      :aria-label="`Overall progress chart. ${chartDescription}`"
      preserveAspectRatio="xMidYMid meet"
    >
      <!-- Score bands -->
      <g aria-hidden="true">
        <rect
          v-for="band in SCORE_BANDS"
          :key="band.label"
          :x="PAD.left"
          :y="yPos(band.max)"
          :width="chartW"
          :height="yPos(band.min) - yPos(band.max)"
          :fill="band.color"
          class="score-band"
        />
        <text
          v-for="band in SCORE_BANDS"
          :key="`${band.label}-label`"
          :x="PAD.left + chartW + 8"
          :y="yPos((band.min + band.max) / 2) + 3"
          class="band-label"
        >
          {{ band.label }} {{ scoreBandRangeLabel(band) }}
        </text>
      </g>

      <!-- Grid -->
      <line
        v-for="y in yGridLines"
        :key="y"
        :x1="PAD.left"
        :x2="PAD.left + chartW"
        :y1="yPos(y)"
        :y2="yPos(y)"
        class="grid-line"
      />

      <!-- Y labels -->
      <text
        v-for="y in [1, 3, 5]"
        :key="y"
        :x="PAD.left - 6"
        :y="yPos(y) + 4"
        class="axis-label"
        text-anchor="end"
      >
        {{ y }}
      </text>

      <!-- Y axis title -->
      <text
        :x="12"
        :y="PAD.top + chartH / 2"
        class="axis-title"
        text-anchor="middle"
        transform="rotate(-90 12 72)"
      >
        score
      </text>

      <!-- X labels (attempt numbers) -->
      <text
        v-for="n in xLabels"
        :key="n"
        :x="xPos(n - 1)"
        :y="H - 22"
        class="axis-label"
        text-anchor="middle"
      >
        {{ n }}
      </text>

      <!-- X axis title -->
      <text
        :x="PAD.left + chartW / 2"
        :y="H - 8"
        class="axis-title"
        text-anchor="middle"
      >
        attempt
      </text>

      <!-- Lines per scenario -->
      <g v-for="scenario in visibleScenarios" :key="scenario.id">
        <polyline
          :points="polyline(scenario)"
          :stroke="colorFor(scenarios.findIndex((s) => s.id === scenario.id))"
          fill="none"
          stroke-width="2"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        <g
          v-for="(attempt, j) in scenario.attempts"
          :key="j"
          class="point-hit"
          tabindex="0"
          @mouseenter="
            activePoint = { scenarioId: scenario.id, attemptIndex: j }
          "
          @mouseleave="activePoint = null"
          @focus="activePoint = { scenarioId: scenario.id, attemptIndex: j }"
          @blur="activePoint = null"
        >
          <circle
            :cx="xPos(j)"
            :cy="yPos(avgScore(attempt))"
            r="3.5"
            :fill="colorFor(scenarios.findIndex((s) => s.id === scenario.id))"
          >
            <title>
              {{ scenario.title }}, attempt {{ j + 1 }}:
              {{ formatScore(avgScore(attempt)) }} out of 5 -
              {{ scoreLabel(avgScore(attempt)) }}
            </title>
          </circle>
          <circle
            :cx="xPos(j)"
            :cy="yPos(avgScore(attempt))"
            r="9"
            class="point-hit-target"
          />
        </g>
        <text
          v-if="latestAttempt(scenario)"
          :x="latestX(scenario) + 8"
          :y="latestY(scenario) + 4"
          :fill="colorFor(scenarios.findIndex((s) => s.id === scenario.id))"
          class="latest-label"
        >
          {{ formatScore(scenario.latestAvg) }}
          {{ scoreLabel(scenario.latestAvg) }}
        </text>
      </g>

      <g class="point-popover-layer">
        <template v-for="scenario in visibleScenarios" :key="scenario.id">
          <foreignObject
            v-for="(attempt, j) in scenario.attempts"
            v-show="isActivePoint(scenario.id, j)"
            :key="j"
            :x="popoverX(j)"
            :y="popoverY(avgScore(attempt))"
            :width="popoverWidth"
            :height="popoverHeight"
            class="point-popover"
          >
            <div class="point-popover__card">
              <p class="point-popover__title">
                {{ scenario.title }} attempt {{ j + 1 }}
              </p>
              <dl>
                <div
                  v-for="[key, label] in DIMENSION_ENTRIES"
                  :key="key"
                  class="point-popover__row"
                >
                  <dt>{{ label }}</dt>
                  <dd>
                    <span class="point-popover__score">
                      {{ formatScore(attempt.scores[key]) }}/5
                    </span>
                    <span class="point-popover__band">
                      {{ scoreLabel(attempt.scores[key]) }}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </foreignObject>
        </template>
      </g>
    </svg>

    <!-- Legend with latest score -->
    <div class="legend">
      <div
        v-for="scenario in scenarios"
        :key="scenario.id"
        class="legend-item"
        :class="{ 'legend-item--muted': !visible.has(scenario.id) }"
      >
        <span
          class="legend-dot"
          :style="{ background: colorFor(scenarios.indexOf(scenario)) }"
        />
        <span class="legend-name">{{ scenario.title }}</span>
        <span class="legend-score">
          {{ formatScore(scenario.latestAvg) }}/5 -
          {{ scoreLabel(scenario.latestAvg) }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.combined-chart {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.chart-svg {
  width: 100%;
  height: auto;
  overflow: visible;
}

.grid-line {
  stroke: rgb(255 255 255 / 0.85);
  stroke-width: 1;
}

.score-band {
  opacity: 0.72;
}

.axis-label {
  font-family: var(--font-sans);
  font-size: 9px;
  fill: var(--color-text);
}

.axis-title {
  font-family: var(--font-sans);
  font-size: 8px;
  fill: var(--color-text);
  opacity: 0.6;
}

.band-label {
  font-family: var(--font-sans);
  font-size: 7.5px;
  fill: var(--color-text);
  opacity: 0.78;
}

.latest-label {
  font-family: var(--font-sans);
  font-size: 8px;
  font-weight: var(--font-weight-medium);
  paint-order: stroke;
  stroke: #fff;
  stroke-width: 3px;
  stroke-linejoin: round;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  transition: opacity 0.15s;
}

.legend-item--muted {
  opacity: 0.35;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-name {
  font-size: 0.75rem;
  color: var(--color-text);
}

.legend-score {
  font-size: 0.75rem;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-strong);
}

.point-hit {
  outline: none;
}

.point-hit-target {
  fill: transparent;
  cursor: help;
}

.point-popover {
  opacity: 1;
  pointer-events: none;
  transition: opacity 0.12s;
}

.point-popover__card {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 6px 7px;
  border: 1px solid var(--color-surface-muted);
  border-radius: 7px;
  background: #fff;
  box-shadow: 0 6px 16px rgb(0 0 0 / 0.1);
  font-family: var(--font-sans);
}

.point-popover__title {
  margin: 0 0 4px;
  overflow: hidden;
  color: var(--color-text-strong);
  font-size: 8px;
  font-weight: var(--font-weight-medium);
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.point-popover dl {
  display: grid;
  gap: 2px;
  margin: 0;
}

.point-popover__row {
  display: grid;
  grid-template-columns: minmax(0, 78px) minmax(0, 1fr);
  align-items: baseline;
  gap: 4px;
  min-width: 0;
}

.point-popover dt,
.point-popover dd {
  min-width: 0;
  font-size: 7px;
  line-height: 1.15;
}

.point-popover dt {
  overflow: hidden;
  color: var(--color-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.point-popover dd {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  justify-content: space-between;
  gap: 4px;
  margin: 0;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-strong);
}

.point-popover__score {
  white-space: nowrap;
}

.point-popover__band {
  overflow: hidden;
  color: var(--color-text);
  font-weight: 400;
  opacity: 0.86;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
