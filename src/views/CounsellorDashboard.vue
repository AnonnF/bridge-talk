<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import DimensionLineChart from '@/components/progress/DimensionLineChart.vue'
import CombinedProgressChart from '@/components/progress/CombinedProgressChart.vue'
import { getScenarios } from '@/services/questionBankApi'
import type { DimensionKey } from '@/types/questionBank'

interface JournalEntry {
  id: string
  user_id: string
  situation: string | null
  went_well: string | null
  was_hard: string | null
  do_differently: string | null
  created_at: string
  profiles: { display_name: string | null }
}

interface QuizRow {
  user_id: string
  scenario_id: string
  clarity: number
  empathy: number
  appropriateness: number
  confidence: number
  safety: number
  completed_at: string
  profiles: { display_name: string | null }
}

interface LearnerProgress {
  userId: string
  displayName: string
  scenarios: {
    id: string
    title: string
    attempts: { completedAt: string; scores: Record<DimensionKey, number> }[]
    latestAvg: number
  }[]
}

const activeTab = ref<'journals' | 'progress'>('journals')
const entries = ref<JournalEntry[]>([])
const learners = ref<LearnerProgress[]>([])
const journalLoading = ref(true)
const progressLoading = ref(true)
const journalSearch = ref('')
const progressSearch = ref('')
const selectedLearnerId = ref('')

onMounted(async () => {
  const [journalData, quizData, scenarios] = await Promise.all([
    supabase
      .from('journal_entries')
      .select(
        'id, user_id, situation, went_well, was_hard, do_differently, created_at, profiles(display_name)',
      )
      .eq('shared_with_counsellor', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('quiz_results')
      .select(
        'user_id, scenario_id, clarity, empathy, appropriateness, confidence, safety, completed_at, profiles(display_name)',
      )
      .order('completed_at', { ascending: true }),
    getScenarios().catch(() => []),
  ])

  entries.value = (journalData.data as unknown as JournalEntry[]) ?? []
  journalLoading.value = false

  const scenarioMap = new Map(scenarios.map((s) => [s.id, s.title]))
  const rows = (quizData.data as unknown as QuizRow[]) ?? []

  const userMap = new Map<string, LearnerProgress>()
  for (const row of rows) {
    if (!userMap.has(row.user_id)) {
      userMap.set(row.user_id, {
        userId: row.user_id,
        displayName: formatLearnerName(row.profiles?.display_name),
        scenarios: [],
      })
    }
    const learner = userMap.get(row.user_id)!
    let scenario = learner.scenarios.find((s) => s.id === row.scenario_id)
    if (!scenario) {
      scenario = {
        id: row.scenario_id,
        title: scenarioMap.get(row.scenario_id) ?? row.scenario_id,
        attempts: [],
        latestAvg: 0,
      }
      learner.scenarios.push(scenario)
    }
    scenario.attempts.push({
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

  for (const learner of userMap.values()) {
    for (const scenario of learner.scenarios) {
      const last = scenario.attempts[scenario.attempts.length - 1]
      const vals = Object.values(last.scores) as number[]
      scenario.latestAvg = vals.reduce((a, b) => a + b, 0) / vals.length
    }
  }

  learners.value = Array.from(userMap.values())
  for (const learner of learners.value) {
    visibleByLearner.value.set(
      learner.userId,
      new Set(learner.scenarios.map((s) => s.id)),
    )
  }
  progressLoading.value = false
})

const visibleByLearner = ref<Map<string, Set<string>>>(new Map())

function toggleScenario(userId: string, scenarioId: string) {
  const current = visibleByLearner.value.get(userId) ?? new Set()
  const next = new Set(current)
  if (next.has(scenarioId)) {
    if (next.size > 1) next.delete(scenarioId)
  } else {
    next.add(scenarioId)
  }
  visibleByLearner.value = new Map(visibleByLearner.value).set(userId, next)
}

function showAll(learner: LearnerProgress) {
  visibleByLearner.value = new Map(visibleByLearner.value).set(
    learner.userId,
    new Set(learner.scenarios.map((s) => s.id)),
  )
}

function allVisible(learner: LearnerProgress): boolean {
  const vis = visibleByLearner.value.get(learner.userId)
  return !vis || vis.size === learner.scenarios.length
}

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

function formatLearnerName(name: string | null | undefined): string {
  return name?.trim() || 'Anonymous'
}

const learnerOptions = computed(() => {
  const options = new Map<string, string>()

  for (const learner of learners.value) {
    options.set(learner.userId, learner.displayName)
  }

  for (const entry of entries.value) {
    if (!options.has(entry.user_id)) {
      options.set(
        entry.user_id,
        formatLearnerName(entry.profiles?.display_name),
      )
    }
  }

  return Array.from(options, ([userId, displayName]) => ({
    userId,
    displayName,
  })).sort(
    (a, b) =>
      a.displayName.localeCompare(b.displayName) ||
      a.userId.localeCompare(b.userId),
  )
})

const filteredEntries = computed(() => {
  const q = journalSearch.value.trim().toLowerCase()
  return entries.value.filter((e) => {
    const matchesLearner =
      !selectedLearnerId.value || e.user_id === selectedLearnerId.value
    const matchesSearch =
      !q ||
      formatLearnerName(e.profiles?.display_name).toLowerCase().includes(q)
    return matchesLearner && matchesSearch
  })
})

const filteredLearners = computed(() => {
  const q = progressSearch.value.trim().toLowerCase()
  return learners.value.filter((l) => {
    const matchesLearner =
      !selectedLearnerId.value || l.userId === selectedLearnerId.value
    const matchesSearch = !q || l.displayName.toLowerCase().includes(q)
    return matchesLearner && matchesSearch
  })
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function attemptLabel(n: number) {
  return n === 1 ? '1 attempt' : `${n} attempts`
}
</script>

<template>
  <div class="dashboard-page">
    <SiteHeader />

    <main class="dashboard-main">
      <div class="dashboard-inner">
        <div class="dashboard-header">
          <div>
            <h1 class="dashboard-title">Counsellor Dashboard</h1>
            <p class="dashboard-subtitle">
              Monitor learner journals and quiz progress
            </p>
          </div>
        </div>

        <label class="learner-filter">
          <span class="learner-filter__label">Learner</span>
          <select
            v-model="selectedLearnerId"
            class="learner-filter__select"
            aria-label="Filter dashboard by learner"
          >
            <option value="">Display all</option>
            <option
              v-for="learner in learnerOptions"
              :key="learner.userId"
              :value="learner.userId"
            >
              {{ learner.displayName }}
            </option>
          </select>
        </label>

        <div class="dashboard-tabs" role="tablist">
          <button
            role="tab"
            :aria-selected="activeTab === 'journals'"
            class="dashboard-tab"
            :class="{ 'dashboard-tab--active': activeTab === 'journals' }"
            @click="activeTab = 'journals'"
          >
            Shared Journals
          </button>
          <button
            role="tab"
            :aria-selected="activeTab === 'progress'"
            class="dashboard-tab"
            :class="{ 'dashboard-tab--active': activeTab === 'progress' }"
            @click="activeTab = 'progress'"
          >
            Quiz Progress
          </button>
        </div>

        <!-- Journals tab -->
        <div v-if="activeTab === 'journals'">
          <div v-if="journalLoading" class="state-message">
            Loading entries…
          </div>
          <template v-else>
            <div class="search-bar">
              <svg
                class="search-bar__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M16.5 16.5l4 4" stroke-linecap="round" />
              </svg>
              <input
                v-model="journalSearch"
                type="search"
                class="search-bar__input"
                placeholder="Search by learner name…"
                aria-label="Search journals by learner name"
              />
              <button
                v-if="journalSearch"
                class="search-bar__clear"
                aria-label="Clear search"
                @click="journalSearch = ''"
              >
                ✕
              </button>
            </div>
            <div v-if="filteredEntries.length === 0" class="state-message">
              {{
                journalSearch
                  ? 'No entries match your search.'
                  : 'No shared entries yet.'
              }}
            </div>
          </template>
          <ul
            v-if="!journalLoading && filteredEntries.length > 0"
            class="entry-list"
          >
            <li
              v-for="entry in filteredEntries"
              :key="entry.id"
              class="entry-card"
            >
              <div class="entry-meta">
                <span class="entry-author">{{
                  entry.profiles?.display_name ?? 'Anonymous'
                }}</span>
                <span class="entry-date">{{
                  formatDate(entry.created_at)
                }}</span>
              </div>
              <div v-if="entry.situation" class="entry-section">
                <h3 class="entry-label">Situation</h3>
                <p class="entry-text">{{ entry.situation }}</p>
              </div>
              <div v-if="entry.went_well" class="entry-section">
                <h3 class="entry-label">What went well</h3>
                <p class="entry-text">{{ entry.went_well }}</p>
              </div>
              <div v-if="entry.was_hard" class="entry-section">
                <h3 class="entry-label">What was hard</h3>
                <p class="entry-text">{{ entry.was_hard }}</p>
              </div>
              <div v-if="entry.do_differently" class="entry-section">
                <h3 class="entry-label">What to do differently</h3>
                <p class="entry-text">{{ entry.do_differently }}</p>
              </div>
            </li>
          </ul>
        </div>

        <!-- Progress tab -->
        <div v-else>
          <div v-if="progressLoading" class="state-message">
            Loading progress…
          </div>
          <template v-else>
            <div class="search-bar">
              <svg
                class="search-bar__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M16.5 16.5l4 4" stroke-linecap="round" />
              </svg>
              <input
                v-model="progressSearch"
                type="search"
                class="search-bar__input"
                placeholder="Search by learner name…"
                aria-label="Search quiz progress by learner name"
              />
              <button
                v-if="progressSearch"
                class="search-bar__clear"
                aria-label="Clear search"
                @click="progressSearch = ''"
              >
                ✕
              </button>
            </div>
            <div v-if="filteredLearners.length === 0" class="state-message">
              {{
                progressSearch
                  ? 'No learners match your search.'
                  : 'No quiz results yet.'
              }}
            </div>
          </template>
          <div
            v-if="!progressLoading && filteredLearners.length > 0"
            class="learner-list"
          >
            <div
              v-for="learner in filteredLearners"
              :key="learner.userId"
              class="learner-card"
            >
              <h2 class="learner-name">{{ learner.displayName }}</h2>

              <div class="learner-combined">
                <div class="scenario-toggles">
                  <button
                    v-for="(scenario, i) in learner.scenarios"
                    :key="scenario.id"
                    class="toggle-pill"
                    :style="
                      (visibleByLearner.get(learner.userId) ?? new Set()).has(
                        scenario.id,
                      )
                        ? {
                            background: colorFor(i),
                            borderColor: colorFor(i),
                            color: '#fff',
                          }
                        : { borderColor: colorFor(i), color: colorFor(i) }
                    "
                    @click="toggleScenario(learner.userId, scenario.id)"
                  >
                    {{ scenario.title }}
                  </button>
                  <button
                    v-if="!allVisible(learner)"
                    class="toggle-pill toggle-pill--reset"
                    @click="showAll(learner)"
                  >
                    Show all
                  </button>
                </div>
                <CombinedProgressChart
                  :scenarios="learner.scenarios"
                  :visible="visibleByLearner.get(learner.userId) ?? new Set()"
                />
              </div>

              <div class="scenario-list">
                <div
                  v-for="scenario in learner.scenarios"
                  :key="scenario.id"
                  class="scenario-progress"
                >
                  <div class="scenario-progress__header">
                    <div>
                      <p class="scenario-progress__title">
                        {{ scenario.title }}
                      </p>
                      <p class="scenario-progress__meta">
                        {{ attemptLabel(scenario.attempts.length) }}
                      </p>
                    </div>
                    <div class="scenario-progress__score">
                      <span class="scenario-progress__score-value">{{
                        scenario.latestAvg.toFixed(1)
                      }}</span>
                      <span class="scenario-progress__score-max">/5</span>
                    </div>
                  </div>
                  <DimensionLineChart :attempts="scenario.attempts" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.dashboard-page {
  min-height: 100svh;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
}

.dashboard-main {
  flex: 1;
  padding: 6rem var(--space-page-x) 3rem;
}

.dashboard-inner {
  max-width: var(--max-content);
  margin-inline: auto;
}

.dashboard-header {
  margin-bottom: 2rem;
}

.dashboard-title {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: var(--font-weight-heading);
  color: var(--color-text-strong);
  margin: 0 0 0.25rem;
}

.dashboard-subtitle {
  font-size: var(--text-body);
  color: var(--color-text);
  margin: 0;
}

.learner-filter {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-width: 20rem;
  margin-bottom: 1.5rem;
}

.learner-filter__label {
  font-size: 0.8125rem;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-strong);
}

.learner-filter__select {
  width: 100%;
  padding: 0.625rem 0.75rem;
  background: #fff;
  border: 1.5px solid var(--color-radio-border);
  border-radius: 8px;
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  color: var(--color-text-strong);
}

.learner-filter__select:focus {
  outline: none;
  border-color: var(--color-text-strong);
}

.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  background: #fff;
  border: 1.5px solid var(--color-radio-border);
  border-radius: 8px;
  transition: border-color 0.15s;
}

.search-bar:focus-within {
  border-color: var(--color-text-strong);
}

.search-bar__icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  margin-left: 0.75rem;
  color: var(--color-text);
  pointer-events: none;
}

.search-bar__input {
  flex: 1;
  padding: 0.625rem 0.75rem;
  border: none;
  background: transparent;
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  color: var(--color-text-strong);
  outline: none;
}

.search-bar__input::placeholder {
  color: var(--color-radio-border);
}

.search-bar__clear {
  padding: 0 0.75rem;
  background: none;
  border: none;
  font-size: 0.75rem;
  color: var(--color-text);
  cursor: pointer;
  line-height: 1;
}

.search-bar__clear:hover {
  color: var(--color-text-strong);
}

.dashboard-tabs {
  display: flex;
  border-bottom: 1.5px solid var(--color-surface-muted);
  margin-bottom: 2rem;
}

.dashboard-tab {
  padding: 0.5rem 1.25rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1.5px;
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  cursor: pointer;
  transition:
    color 0.15s,
    border-color 0.15s;
}

.dashboard-tab:hover {
  color: var(--color-text-strong);
}
.dashboard-tab--active {
  color: var(--color-text-strong);
  border-bottom-color: var(--color-text-strong);
}

.state-message {
  color: var(--color-text);
  font-size: var(--text-body);
  padding: 2rem 0;
}

.entry-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.entry-card {
  background: #fff;
  border: 1.5px solid var(--color-surface-muted);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.entry-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.entry-author {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-strong);
  font-size: 0.9375rem;
}

.entry-date {
  font-size: 0.875rem;
  color: var(--color-text);
}

.entry-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.entry-label {
  font-size: 0.75rem;
  font-weight: var(--font-weight-medium);
  color: var(--color-badge-text);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}

.entry-text {
  font-size: 0.9375rem;
  color: var(--color-text);
  line-height: var(--line-height-body);
  margin: 0;
}

.learner-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.learner-card {
  background: #fff;
  border: 1.5px solid var(--color-surface-muted);
  border-radius: 12px;
  padding: 1.5rem;
}

.learner-name {
  font-size: 1.125rem;
  font-weight: var(--font-weight-heading);
  color: var(--color-text-strong);
  margin: 0 0 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-surface-muted);
}

.learner-combined {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-surface-muted);
}

.scenario-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.toggle-pill {
  padding: 0.3rem 0.875rem;
  border-radius: var(--radius-pill);
  border: 1.5px solid;
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  background: transparent;
  transition:
    background 0.15s,
    color 0.15s;
}

.toggle-pill--reset {
  border-color: var(--color-radio-border);
  color: var(--color-text);
}

.toggle-pill--reset:hover {
  border-color: var(--color-text-strong);
  color: var(--color-text-strong);
}

.scenario-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.scenario-progress {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.scenario-progress__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.scenario-progress__title {
  font-size: 0.9375rem;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-strong);
  margin: 0 0 0.2rem;
}

.scenario-progress__meta {
  font-size: 0.8125rem;
  color: var(--color-text);
  margin: 0;
}

.scenario-progress__score {
  display: flex;
  align-items: baseline;
  gap: 1px;
  flex-shrink: 0;
}

.scenario-progress__score-value {
  font-size: 1.5rem;
  font-weight: var(--font-weight-heading);
  color: var(--color-text-strong);
  line-height: 1;
}

.scenario-progress__score-max {
  font-size: 0.875rem;
  color: var(--color-text);
}
</style>
