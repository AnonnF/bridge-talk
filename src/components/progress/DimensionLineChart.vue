<script setup lang="ts">
import type { DimensionKey } from '@/types/questionBank'

interface Attempt {
  completedAt: string
  scores: Record<DimensionKey, number>
}

const props = defineProps<{ attempts: Attempt[] }>()

const W = 480
const H = 160
const PAD = { top: 12, right: 16, bottom: 28, left: 28 }
const chartW = W - PAD.left - PAD.right
const chartH = H - PAD.top - PAD.bottom

const DIMENSIONS: { key: DimensionKey; label: string; color: string }[] = [
  { key: 'clarity', label: 'Clarity', color: '#5a8a72' },
  { key: 'empathy', label: 'Empathy', color: '#a0685a' },
  { key: 'appropriateness', label: 'Appropriateness', color: '#8a7a42' },
  { key: 'confidence', label: 'Confidence', color: '#5a6a8a' },
  { key: 'safety', label: 'Safety', color: '#8a6a9a' },
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

const yGridLines = [0, 1, 2, 3, 4, 5]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}
</script>

<template>
  <div class="chart-wrap">
    <svg
      :viewBox="`0 0 ${W} ${H}`"
      class="chart-svg"
      aria-hidden="true"
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
          v-for="(attempt, i) in attempts"
          :key="i"
          :x="xPos(i)"
          :y="H - 4"
          class="axis-label"
          text-anchor="middle"
        >
          {{ attempts.length === 1 ? formatDate(attempt.completedAt) : i + 1 }}
        </text>
      </g>

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
        />
      </g>
    </svg>

    <!-- Legend -->
    <div class="legend">
      <div v-for="dim in DIMENSIONS" :key="dim.key" class="legend-item">
        <span class="legend-dot" :style="{ background: dim.color }" />
        <span class="legend-label">{{ dim.label }}</span>
      </div>
    </div>
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
</style>
