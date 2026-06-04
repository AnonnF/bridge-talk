<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/composables/useAuth'
import { getScenarios } from '@/services/questionBankApi'
import type { DimensionKey } from '@/types/questionBank'
import DimensionLineChart from './DimensionLineChart.vue'

interface DbResult {
  id: string
  scenario_id: string
  clarity: number
  empathy: number
  appropriateness: number
  confidence: number
  safety: number
  completed_at: string
}

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

const { user } = useAuth()
const loading = ref(true)
const scenarioProgress = ref<ScenarioProgress[]>([])

onMounted(async () => {
  if (!user.value) return

  const [{ data }, scenarios] = await Promise.all([
    supabase
      .from('quiz_results')
      .select('*')
      .eq('user_id', user.value.id)
      .order('completed_at', { ascending: true }),
    getScenarios().catch(() => []),
  ])

  const rows = (data ?? []) as DbResult[]
  const scenarioMap = new Map(scenarios.map((s) => [s.id, s.title]))

  const grouped = new Map<string, Attempt[]>()
  for (const row of rows) {
    if (!grouped.has(row.scenario_id)) grouped.set(row.scenario_id, [])
    grouped.get(row.scenario_id)!.push({
      completedAt: row.completed_at,
      scores: {
        clarity: row.clarity,
        empathy: row.empathy,
        appropriateness: row.appropriateness,
        confidence: row.confidence,
        safety: row.safety,
      },
    })
  }

  scenarioProgress.value = Array.from(grouped.entries()).map(
    ([id, attempts]) => {
      const last = attempts[attempts.length - 1]
      const vals = Object.values(last.scores) as number[]
      const latestAvg = vals.reduce((a, b) => a + b, 0) / vals.length
      return {
        id,
        title: scenarioMap.get(id) ?? id,
        attempts,
        latestAvg,
      }
    },
  )

  loading.value = false
})

const hasResults = computed(() => scenarioProgress.value.length > 0)

function avgLabel(avg: number): string {
  return avg.toFixed(1)
}

function attemptLabel(n: number): string {
  return n === 1 ? '1 attempt' : `${n} attempts`
}
</script>

<template>
  <div class="progress-tab">
    <div v-if="loading" class="progress-empty">
      <p>Loading your progress…</p>
    </div>

    <div v-else-if="!hasResults" class="progress-empty">
      <div class="progress-empty__icon">📈</div>
      <p class="progress-empty__title">No results yet</p>
      <p class="progress-empty__subtitle">
        Complete a scenario in the Learn section to start tracking your
        progress.
      </p>
    </div>

    <div v-else class="progress-grid">
      <div
        v-for="scenario in scenarioProgress"
        :key="scenario.id"
        class="progress-card"
      >
        <div class="progress-card__header">
          <div>
            <h3 class="progress-card__title">{{ scenario.title }}</h3>
            <p class="progress-card__meta">
              {{ attemptLabel(scenario.attempts.length) }}
            </p>
          </div>
          <div class="progress-card__score">
            <span class="progress-card__score-value">{{
              avgLabel(scenario.latestAvg)
            }}</span>
            <span class="progress-card__score-max">/5</span>
          </div>
        </div>

        <DimensionLineChart :attempts="scenario.attempts" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.progress-tab {
  width: 100%;
  max-width: 52rem;
  margin-inline: auto;
  padding-top: 0.5rem;
}

.progress-empty {
  text-align: center;
  padding: 3rem 1rem;
  background: var(--color-surface-muted);
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.progress-empty__icon {
  font-size: 2rem;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.progress-empty__title {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-strong);
  font-size: 1rem;
  margin: 0;
}

.progress-empty__subtitle {
  color: var(--color-text);
  font-size: 0.9375rem;
  margin: 0;
  max-width: 28rem;
  line-height: 1.5;
}

.progress-grid {
  display: grid;
  gap: 1.25rem;
}

.progress-card {
  background: #fff;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.progress-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.progress-card__title {
  font-size: 1rem;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-strong);
  margin: 0 0 0.2rem;
}

.progress-card__meta {
  font-size: 0.8125rem;
  color: var(--color-text);
  margin: 0;
}

.progress-card__score {
  display: flex;
  align-items: baseline;
  gap: 1px;
  flex-shrink: 0;
}

.progress-card__score-value {
  font-size: 1.5rem;
  font-weight: var(--font-weight-heading);
  color: var(--color-text-strong);
  line-height: 1;
}

.progress-card__score-max {
  font-size: 0.875rem;
  color: var(--color-text);
}
</style>
