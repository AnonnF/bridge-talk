<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  DIMENSION_DESCRIPTIONS,
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

const props = defineProps<{ attempts: Attempt[] }>()

const W = 480
const H = 176
const PAD = { top: 12, right: 112, bottom: 44, left: 44 }
const chartW = W - PAD.left - PAD.right
const chartH = H - PAD.top - PAD.bottom
const popoverWidth = 190
const popoverHeight = 106
const activePoint = ref<{
  dimension: DimensionKey
  attemptIndex: number
} | null>(null)

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

function latestAttempt(): Attempt | null {
  return props.attempts[props.attempts.length - 1] ?? null
}

function latestX(): number {
  return xPos(Math.max(props.attempts.length - 1, 0))
}

function latestY(key: DimensionKey): number {
  const latest = latestAttempt()
  return latest ? yPos(latest.scores[key]) : PAD.top + chartH
}

function latestScore(key: DimensionKey): number {
  return latestAttempt()?.scores[key] ?? 0
}

function latestLabelDy(index: number): number {
  return [-12, -4, 4, 12, 20][index] ?? 0
}

function popoverX(i: number): number {
  return Math.min(Math.max(xPos(i) + 8, 4), W - popoverWidth - 4)
}

function popoverY(score: number): number {
  return Math.min(
    Math.max(yPos(score) - popoverHeight, 4),
    H - popoverHeight - 4,
  )
}

function isActivePoint(dimension: DimensionKey, attemptIndex: number): boolean {
  return (
    activePoint.value?.dimension === dimension &&
    activePoint.value.attemptIndex === attemptIndex
  )
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
      `${dim.label} latest score ${formatScore(latest.scores[dim.key])} out of 5, ${scoreLabel(latest.scores[dim.key])}`,
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
          v-for="y in [1, 3, 5]"
          :key="y"
          :x="PAD.left - 6"
          :y="yPos(y) + 4"
          class="axis-label"
          text-anchor="end"
        >
          {{ y }}
        </text>
      </g>

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
      <g v-for="(dim, dimIndex) in DIMENSIONS" :key="dim.key">
        <polyline
          :points="polyline(dim.key)"
          :stroke="dim.color"
          fill="none"
          stroke-width="2"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        <!-- Dots -->
        <g
          v-for="(attempt, i) in attempts"
          :key="i"
          class="point-hit"
          tabindex="0"
          @mouseenter="activePoint = { dimension: dim.key, attemptIndex: i }"
          @mouseleave="activePoint = null"
          @focus="activePoint = { dimension: dim.key, attemptIndex: i }"
          @blur="activePoint = null"
        >
          <circle
            :cx="xPos(i)"
            :cy="yPos(attempt.scores[dim.key])"
            r="3.5"
            :fill="dim.color"
          >
            <title>
              Attempt {{ i + 1 }} breakdown. {{ dim.label }}:
              {{ formatScore(attempt.scores[dim.key]) }} out of 5 -
              {{ scoreLabel(attempt.scores[dim.key]) }}
            </title>
          </circle>
          <circle
            :cx="xPos(i)"
            :cy="yPos(attempt.scores[dim.key])"
            r="9"
            class="point-hit-target"
          />
        </g>
        <text
          v-if="latestAttempt()"
          :x="latestX() + 8"
          :y="latestY(dim.key) + latestLabelDy(dimIndex)"
          :fill="dim.color"
          class="latest-label"
        >
          {{ formatScore(latestScore(dim.key)) }}
          {{ scoreLabel(latestScore(dim.key)) }}
        </text>
      </g>

      <g class="point-popover-layer">
        <template v-for="dim in DIMENSIONS" :key="dim.key">
          <foreignObject
            v-for="(attempt, i) in attempts"
            v-show="isActivePoint(dim.key, i)"
            :key="i"
            :x="popoverX(i)"
            :y="popoverY(attempt.scores[dim.key])"
            :width="popoverWidth"
            :height="popoverHeight"
            class="point-popover"
          >
            <div class="point-popover__card">
              <p class="point-popover__title">Attempt {{ i + 1 }}</p>
              <dl>
                <div v-for="metric in DIMENSIONS" :key="metric.key">
                  <dt>{{ metric.label }}</dt>
                  <dd>
                    <span class="point-popover__score">
                      {{ formatScore(attempt.scores[metric.key]) }}/5
                    </span>
                    <span class="point-popover__band">
                      {{ scoreLabel(attempt.scores[metric.key]) }}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </foreignObject>
        </template>
      </g>
    </svg>

    <!-- Legend -->
    <div class="legend">
      <div v-for="dim in DIMENSIONS" :key="dim.key" class="legend-item">
        <span class="legend-dot" :style="{ background: dim.color }" />
        <span class="legend-label">{{ dim.label }}</span>
        <div v-if="dim.key === 'safety'" class="metric-help">
          <button
            class="metric-help__button"
            type="button"
            aria-label="Show dimension descriptions"
          >
            ?
          </button>
          <dl class="metric-help__panel">
            <div
              v-for="metric in DIMENSIONS"
              :key="metric.key"
              class="metric-help__item"
            >
              <dt>{{ metric.label }}</dt>
              <dd>{{ DIMENSION_DESCRIPTIONS[metric.key] }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-wrap {
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

.metric-help {
  position: relative;
}

.metric-help__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  padding: 0;
  border: 1px solid var(--color-radio-border);
  border-radius: 50%;
  background: #fff;
  color: var(--color-text-strong);
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: var(--font-weight-medium);
  line-height: 1rem;
  text-align: center;
  cursor: help;
}

.metric-help__button:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

.metric-help__panel {
  position: absolute;
  right: 0;
  bottom: 1.375rem;
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

.metric-help:hover .metric-help__panel,
.metric-help:focus-within .metric-help__panel {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.metric-help__item {
  display: grid;
  grid-template-columns: 6.5rem minmax(0, 1fr);
  align-items: baseline;
  gap: 0.5rem;
}

.metric-help dt {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-strong);
}

.metric-help dd {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 0.75rem;
  line-height: 1.45;
  color: var(--color-text);
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
  font-size: 8px;
  font-weight: var(--font-weight-medium);
  line-height: 1.1;
  color: var(--color-text-strong);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.point-popover dl {
  display: grid;
  gap: 2px;
  margin: 0;
}

.point-popover dl div {
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
