<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  DIMENSION_LABELS,
  formatScore,
  getScoreBand,
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

/** Padding so axis labels (e.g. Appropriateness) are not clipped by the viewBox. */
const padding = 64
const plotSize = 200
const viewSize = plotSize + padding * 2
const center = viewSize / 2
const chartRadius = 76
const labelRadius = 96
const popoverWidth = 190
const popoverHeight = 106
const activeDimension = ref<DimensionKey | null>(null)

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
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const x = center + labelRadius * cos
    const y = center + labelRadius * sin

    const isTop = sin < -0.45
    const isBottom = sin > 0.45
    const isRight = cos > 0

    const anchor: 'start' | 'middle' | 'end' =
      isTop || isBottom ? 'middle' : isRight ? 'start' : 'end'
    const dx = isTop || isBottom ? 0 : isRight ? 10 : -10
    const dy = isTop ? -8 : isBottom ? 10 : 0

    return {
      key,
      text: DIMENSION_LABELS[key],
      x,
      y,
      anchor,
      dx,
      dy,
    }
  }),
)

const chartDescription = computed(() =>
  dimensionOrder
    .map(
      (key) =>
        `${DIMENSION_LABELS[key]} ${props.scores[key]} out of ${props.maxScore}, ${getScoreBand(props.scores[key]).label}`,
    )
    .join(', '),
)

function popoverX(index: number, value: number): number {
  const point = polarPoint(index, value)
  return Math.min(Math.max(point.x + 8, 4), viewSize - popoverWidth - 4)
}

function popoverY(index: number, value: number): number {
  const point = polarPoint(index, value)
  return Math.min(
    Math.max(point.y - popoverHeight, 4),
    viewSize - popoverHeight - 4,
  )
}
</script>

<template>
  <figure class="radar-chart">
    <svg
      class="radar-chart__svg"
      :viewBox="`0 0 ${viewSize} ${viewSize}`"
      overflow="visible"
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

      <g class="radar-chart__points">
        <g
          v-for="(key, index) in dimensionOrder"
          :key="key"
          class="point-hit"
          tabindex="0"
          @mouseenter="activeDimension = key"
          @mouseleave="activeDimension = null"
          @focus="activeDimension = key"
          @blur="activeDimension = null"
        >
          <circle
            :cx="polarPoint(index, scores[key]).x"
            :cy="polarPoint(index, scores[key]).y"
            r="4"
            class="radar-chart__point"
          >
            <title>
              Result breakdown. {{ DIMENSION_LABELS[key] }}:
              {{ scores[key] }} out of {{ maxScore }} -
              {{ getScoreBand(scores[key]).label }}
            </title>
          </circle>
          <circle
            :cx="polarPoint(index, scores[key]).x"
            :cy="polarPoint(index, scores[key]).y"
            r="10"
            class="point-hit-target"
          />
        </g>
      </g>

      <g class="radar-chart__labels">
        <text
          v-for="label in labels"
          :key="label.key"
          :x="label.x"
          :y="label.y"
          :dx="label.dx"
          :dy="label.dy"
          :text-anchor="label.anchor"
          dominant-baseline="middle"
          class="radar-chart__label"
        >
          {{ label.text }}
        </text>
      </g>

      <g class="point-popover-layer">
        <foreignObject
          v-for="(key, index) in dimensionOrder"
          v-show="activeDimension === key"
          :key="key"
          :x="popoverX(index, scores[key])"
          :y="popoverY(index, scores[key])"
          :width="popoverWidth"
          :height="popoverHeight"
          class="point-popover"
        >
          <div class="point-popover__card">
            <p class="point-popover__title">Result breakdown</p>
            <dl>
              <div
                v-for="metric in dimensionOrder"
                :key="metric"
                class="point-popover__row"
              >
                <dt>{{ DIMENSION_LABELS[metric] }}</dt>
                <dd>
                  <span class="point-popover__score">
                    {{ formatScore(scores[metric]) }}/{{ maxScore }}
                  </span>
                  <span class="point-popover__band">
                    {{ getScoreBand(scores[metric]).label }}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </foreignObject>
      </g>
    </svg>
    <figcaption class="visually-hidden">{{ chartDescription }}</figcaption>
  </figure>
</template>

<style scoped>
.radar-chart {
  position: relative;
  margin: 0;
  display: flex;
  justify-content: center;
  overflow: visible;
  padding-inline: 0.25rem;
}

.radar-chart__svg {
  width: min(100%, 20rem);
  height: auto;
  overflow: visible;
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
