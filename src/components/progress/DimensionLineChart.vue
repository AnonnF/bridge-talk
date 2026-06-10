<script setup lang="ts">
import { computed } from 'vue'
import {
  DIMENSION_DESCRIPTIONS,
  DIMENSION_LABELS,
  getScoreBand,
  type DimensionKey,
} from '@/types/questionBank'

interface Attempt {
  completedAt: string
  scores: Record<DimensionKey, number>
}

const props = withDefaults(
  defineProps<{
    attempts: Attempt[]
    showGlossary?: boolean
  }>(),
  {
    showGlossary: false,
  },
)

const W = 480
const H = 176
const PAD = { top: 12, right: 16, bottom: 44, left: 28 }
const chartW = W - PAD.left - PAD.right
const chartH = H - PAD.top - PAD.bottom

const DIMENSIONS: { key: DimensionKey; label: string; color: string }[] = [
  { key: 'clarity', label: DIMENSION_LABELS.clarity, color: '#5a8a72' },
  { key: 'empathy', label: DIMENSION_LABELS.empathy, color: '#a0685a' },
  {
    key: 'appropriateness',
    label: DIMENSION_LABELS.appropriateness,
    color: '#8a7a42',
  },
  { key: 'confidence', label: DIMENSION_LABELS.confidence, color: '#5a6a8a' },
  { key: 'safety', label: DIMENSION_LABELS.safety, color: '#8a6a9a' },
]

function xPos(i: number): number {
  const n = props.attempts.length
  if (n === 1) return PAD.left + chartW / 2
  return PAD.left + (i / (n - 1)) * chartW
}

function yPos(score: number): number {
  return PAD.top + ((5 - score) / 5) * chartH
}

function polyline(key: DimensionKey): string {
  return props.attempts
    .map((a, i) => `${xPos(i)},${yPos(a.scores[key])}`)
    .join(' ')
}

function scoreLabel(score: number): string {
  return getScoreBand(score).label
}

const yGridLines = [0, 1, 2, 3, 4, 5]

// Show at most 5 attempt labels evenly spread to avoid crowding
function xLabels(): number[] {
  const n = props.attempts.length
  if (n <= 5) return Array.from({ length: n }, (_, i) => i + 1)
  const step = (n - 1) / 4
  return [0, 1, 2, 3, 4].map((i) => Math.round(i * step) + 1)
}

const chartDescription = computed(() => {
  const latest = props.attempts[props.attempts.length - 1]
  if (!latest) return 'No dimension scores yet.'
  return DIMENSIONS.map(
    (dim) =>
      `${dim.label} latest score ${latest.scores[dim.key].toFixed(1)} out of 5, ${scoreLabel(latest.scores[dim.key])}`,
  ).join('; ')
})
</script>

<template>
  <div class="chart-wrap">
    <svg
      :viewBox="`0 0 ${W} ${H}`"
      class="chart-svg"
      role="img"
      :aria-label="`Dimension progress chart. ${chartDescription}`"
      preserveAspectRatio="xMidYMid meet"
    >
      <!-- Grid lines -->
      <g class="grid">
        <line
          v-for="y in yGridLines"
          :key="y"
          :x1="PAD.left"
          :x2="PAD.left + chartW"
          :y1="yPos(y)"
          :y2="yPos(y)"
          class="grid-line"
        />
      </g>

      <!-- Y axis labels -->
      <g class="y-labels">
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
      </g>

      <!-- X axis attempt labels -->
      <g class="x-labels">
        <text
          v-for="n in xLabels()"
          :key="n"
          :x="xPos(n - 1)"
          :y="H - 22"
          class="axis-label"
          text-anchor="middle"
        >
          {{ n }}
        </text>
      </g>

      <!-- X axis title -->
      <text
        :x="PAD.left + chartW / 2"
        :y="H - 8"
        class="axis-title"
        text-anchor="middle"
      >
        attempt
      </text>

      <!-- Dimension lines -->
      <g v-for="dim in DIMENSIONS" :key="dim.key">
        <polyline
          :points="polyline(dim.key)"
          :stroke="dim.color"
          fill="none"
          stroke-width="2"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        <!-- Dots -->
        <circle
          v-for="(attempt, i) in attempts"
          :key="i"
          :cx="xPos(i)"
          :cy="yPos(attempt.scores[dim.key])"
          r="3.5"
          :fill="dim.color"
        >
          <title>
            {{ dim.label }}, attempt {{ i + 1 }}:
            {{ attempt.scores[dim.key].toFixed(1) }} out of 5 -
            {{ scoreLabel(attempt.scores[dim.key]) }}
          </title>
        </circle>
      </g>
    </svg>

    <!-- Legend -->
    <div class="legend">
      <div v-for="dim in DIMENSIONS" :key="dim.key" class="legend-item">
        <span class="legend-dot" :style="{ background: dim.color }" />
        <span class="legend-label">{{ dim.label }}</span>
      </div>
    </div>

    <dl v-if="showGlossary" class="dimension-glossary">
      <div
        v-for="dim in DIMENSIONS"
        :key="dim.key"
        class="dimension-glossary__item"
      >
        <dt>{{ dim.label }}</dt>
        <dd>{{ DIMENSION_DESCRIPTIONS[dim.key] }}</dd>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.chart-wrap {
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
  gap: 0.5rem 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  font-size: 0.75rem;
  color: var(--color-text);
}

.dimension-glossary {
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding: 0.75rem 0 0;
  border-top: 1px solid var(--color-surface-muted);
}

.dimension-glossary__item {
  display: grid;
  gap: 0.125rem;
}

.dimension-glossary dt {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-strong);
}

.dimension-glossary dd {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 0.75rem;
  line-height: 1.45;
  color: var(--color-text);
}
</style>
