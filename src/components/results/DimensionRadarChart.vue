<script setup lang="ts">
import { computed } from 'vue'
import {
  DIMENSION_LABELS,
  type DimensionKey,
  type DimensionScores,
} from '../../types/questionBank'

const props = withDefaults(
  defineProps<{
    scores: DimensionScores
    maxScore?: number
  }>(),
  {
    maxScore: 5,
  },
)

const dimensionOrder: DimensionKey[] = [
  'clarity',
  'empathy',
  'appropriateness',
  'confidence',
  'safety',
]

const viewSize = 280
const center = viewSize / 2
const chartRadius = 88
const labelRadius = 118

function axisAngle(index: number): number {
  return (Math.PI * 2 * index) / dimensionOrder.length - Math.PI / 2
}

function polarPoint(index: number, value: number): { x: number; y: number } {
  const angle = axisAngle(index)
  const radius = (value / props.maxScore) * chartRadius
  return {
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle),
  }
}

function toPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) {
    return ''
  }
  const [first, ...rest] = points
  return `M ${first.x} ${first.y} ${rest.map((point) => `L ${point.x} ${point.y}`).join(' ')} Z`
}

const gridPolygons = computed(() =>
  [1, 2, 3, 4, 5].map((level) => {
    const points = dimensionOrder.map((_, index) => polarPoint(index, level))
    return toPath(points)
  }),
)

const dataPolygon = computed(() => {
  const points = dimensionOrder.map((key, index) =>
    polarPoint(index, props.scores[key]),
  )
  return toPath(points)
})

const axisLines = computed(() =>
  dimensionOrder.map((_, index) => {
    const end = polarPoint(index, props.maxScore)
    return { x1: center, y1: center, x2: end.x, y2: end.y }
  }),
)

const labels = computed(() =>
  dimensionOrder.map((key, index) => {
    const angle = axisAngle(index)
    const x = center + labelRadius * Math.cos(angle)
    const y = center + labelRadius * Math.sin(angle)
    return {
      key,
      text: DIMENSION_LABELS[key],
      x,
      y,
      anchor:
        Math.abs(Math.cos(angle)) < 0.2
          ? 'middle'
          : Math.cos(angle) > 0
            ? 'start'
            : 'end',
    }
  }),
)

const chartDescription = computed(() =>
  dimensionOrder
    .map(
      (key) =>
        `${DIMENSION_LABELS[key]} ${props.scores[key]} out of ${props.maxScore}`,
    )
    .join(', '),
)
</script>

<template>
  <figure class="radar-chart">
    <svg
      class="radar-chart__svg"
      :viewBox="`0 0 ${viewSize} ${viewSize}`"
      role="img"
      :aria-label="`Communication profile chart: ${chartDescription}`"
    >
      <g class="radar-chart__grid">
        <path
          v-for="(path, index) in gridPolygons"
          :key="index"
          :d="path"
          class="radar-chart__grid-ring"
        />
      </g>

      <g class="radar-chart__axes">
        <line
          v-for="(axis, index) in axisLines"
          :key="index"
          :x1="axis.x1"
          :y1="axis.y1"
          :x2="axis.x2"
          :y2="axis.y2"
          class="radar-chart__axis"
        />
      </g>

      <path :d="dataPolygon" class="radar-chart__data" />

      <g class="radar-chart__points" aria-hidden="true">
        <circle
          v-for="(key, index) in dimensionOrder"
          :key="key"
          :cx="polarPoint(index, scores[key]).x"
          :cy="polarPoint(index, scores[key]).y"
          r="4"
          class="radar-chart__point"
        />
      </g>

      <g class="radar-chart__labels">
        <text
          v-for="label in labels"
          :key="label.key"
          :x="label.x"
          :y="label.y"
          :text-anchor="label.anchor"
          dominant-baseline="middle"
          class="radar-chart__label"
        >
          {{ label.text }}
        </text>
      </g>
    </svg>
    <figcaption class="visually-hidden">{{ chartDescription }}</figcaption>
  </figure>
</template>

<style scoped>
.radar-chart {
  margin: 0;
  display: flex;
  justify-content: center;
}

.radar-chart__svg {
  width: min(100%, 17.5rem);
  height: auto;
}

.radar-chart__grid-ring {
  fill: none;
  stroke: var(--color-surface-muted);
  stroke-width: 1;
}

.radar-chart__axis {
  stroke: var(--color-surface-muted);
  stroke-width: 1;
}

.radar-chart__data {
  fill: rgb(61 69 65 / 0.18);
  stroke: var(--color-text-strong);
  stroke-width: 2;
}

.radar-chart__point {
  fill: var(--color-text-strong);
}

.radar-chart__label {
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-weight: var(--font-weight-medium);
  fill: var(--color-text-strong);
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
</style>
