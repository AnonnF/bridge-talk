<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import ProgressTab from '@/components/progress/ProgressTab.vue'

const { profile } = useAuth()

const greeting = computed(() => {
  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const name = profile.value?.display_name
  return name ? `Good ${timeOfDay}, ${name}` : `Good ${timeOfDay}`
})

const activeTab = ref<'overview' | 'progress'>('overview')

const cards = [
  {
    to: '/learn',
    icon: '🎓',
    iconBg: '#e8f0eb',
    title: 'Multiple choice',
    description:
      'Learn communication skills through guided scenarios at your own pace.',
  },
  {
    to: '/chat',
    icon: '👥',
    iconBg: '#e8eaf6',
    title: 'Human interactions',
    description: 'Practise with peers in a safe, moderated environment.',
  },
  {
    to: '/reflect',
    icon: '📓',
    iconBg: '#f5f0e8',
    title: 'Conversation journal',
    description: 'Reflect on real interactions and track your growth.',
  },
]
</script>

<template>
  <section class="hero" aria-labelledby="hero-heading">
    <div class="hero__inner">
      <p class="hero__greeting">{{ greeting }}</p>
      <h1 id="hero-heading" class="hero__title">
        Practice communication<br />before real conversations
      </h1>
      <p class="hero__subtitle">
        BridgeTalk helps you prepare for everyday situations through guided
        scenarios and safe interaction practice.
      </p>

      <div class="hero__tabs" role="tablist">
        <button
          role="tab"
          :aria-selected="activeTab === 'overview'"
          class="hero__tab"
          :class="{ 'hero__tab--active': activeTab === 'overview' }"
          @click="activeTab = 'overview'"
        >
          Overview
        </button>
        <button
          role="tab"
          :aria-selected="activeTab === 'progress'"
          class="hero__tab"
          :class="{ 'hero__tab--active': activeTab === 'progress' }"
          @click="activeTab = 'progress'"
        >
          My Progress
        </button>
      </div>

      <div v-if="activeTab === 'overview'" class="hero__cards">
        <component
          :is="card.to ? 'RouterLink' : 'div'"
          v-for="card in cards"
          :key="card.title"
          :to="card.to ?? undefined"
          class="feature-card"
        >
          <div class="feature-card__icon" :style="{ background: card.iconBg }">
            {{ card.icon }}
          </div>
          <h2 class="feature-card__title">{{ card.title }}</h2>
          <p class="feature-card__desc">{{ card.description }}</p>
        </component>
      </div>

      <ProgressTab v-else />
    </div>
  </section>
</template>

<style scoped>
.hero {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(8rem, 26vh, 12rem) var(--space-page-x) 5rem;
  text-align: center;
}

.hero__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-hero-gap);
  width: 100%;
  max-width: var(--max-hero);
}

.hero__greeting {
  font-size: var(--text-body);
  color: #4caf7d;
  font-weight: 600;
  margin-bottom: -0.5rem;
}

.hero__title {
  max-width: var(--max-hero);
  font-size: var(--text-hero);
  font-weight: var(--font-weight-heading);
  line-height: var(--line-height-heading);
  letter-spacing: var(--text-hero-tracking);
  color: var(--color-text-strong);
}

.hero__subtitle {
  max-width: var(--max-hero-subtitle);
  font-size: var(--text-body);
  line-height: var(--line-height-body);
  color: var(--color-text);
}

.hero__tabs {
  display: flex;
  border-bottom: 1.5px solid var(--color-surface-muted);
  width: 100%;
  max-width: 52rem;
  margin-bottom: -0.5rem;
}

.hero__tab {
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

.hero__tab:hover {
  color: var(--color-text-strong);
}

.hero__tab--active {
  color: var(--color-text-strong);
  border-bottom-color: var(--color-text-strong);
}

.hero__cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  width: 100%;
  max-width: 52rem;
}

.feature-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1.5rem;
  background: var(--color-surface, #f5f5f0);
  border-radius: 1rem;
  text-decoration: none;
  color: inherit;
  text-align: left;
  transition:
    box-shadow 0.15s,
    transform 0.15s;
}

.feature-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.feature-card__icon {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.feature-card__title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-strong);
}

.feature-card__desc {
  font-size: 0.875rem;
  color: var(--color-text);
  line-height: 1.5;
}
</style>
