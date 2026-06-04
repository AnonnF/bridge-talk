<script setup lang="ts">
import { computed } from 'vue'
import type { DimensionKey } from '@/types/questionBank'

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

function colorFor(index: number): string {
  return COLORS[index % COLORS.length]
}

function avgScore(attempt: Attempt): number {
  const vals = Object.values(attempt.scores) as number[]
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

const W = 480
const H = 160
const PAD = { top: 12, right: 16, bottom: 28, left: 28 }
const chartW = W - PAD.left - PAD.right
const chartH = H - PAD.top - PAD.bottom

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

const yGridLines = [0, 1, 2, 3, 4, 5]

const xLabels = computed(() => {
  const n = maxAttempts.value
  if (n <= 5) return Array.from({ length: n }, (_, i) => i + 1)
  const step = (n - 1) / 4
  return [0, 1, 2, 3, 4].map((i) => Math.round(i * step) + 1)
})
</script>

<template>
  <div class="combined-chart">
    <svg
      :viewBox="`0 0 ${W} ${H}`"
      class="chart-svg"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
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
        v-for="y in [0, 2.5, 5]"
        :key="y"
        :x="PAD.left - 6"
        :y="yPos(y) + 4"
        class="axis-label"
        text-anchor="end"
      >
        {{ y }}
      </text>

      <!-- X labels (attempt numbers) -->
      <text
        v-for="n in xLabels"
        :key="n"
        :x="xPos(n - 1)"
        :y="H - 4"
        class="axis-label"
        text-anchor="middle"
      >
        {{ n }}
      </text>

      <!-- X axis title -->
      <text
        :x="PAD.left + chartW / 2"
        :y="H + 2"
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
        <circle
          v-for="(attempt, j) in scenario.attempts"
          :key="j"
          :cx="xPos(j)"
          :cy="yPos(avgScore(attempt))"
          r="3.5"
          :fill="colorFor(scenarios.findIndex((s) => s.id === scenario.id))"
        />
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
        <span class="legend-score">{{ scenario.latestAvg.toFixed(1) }}/5</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.combined-chart {
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
  stroke: var(--color-surface-muted);
  stroke-width: 1;
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
</style>
