<script setup lang="ts">
import SiteHeader from '../components/layout/SiteHeader.vue'
</script>

<template>
  <div class="practice-page">
    <SiteHeader />
    <main class="practice-main">
      <h1>Practice</h1>
      <p>Guided scenarios are coming soon. Check back shortly.</p>
      <RouterLink to="/" class="back-link">Back to home</RouterLink>
    </main>
  </div>
</template>

<style scoped>
.practice-page {
  display: flex;
  flex-direction: column;
  min-height: 100svh;
}

.practice-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-hero-gap);
  padding: var(--space-page-x);
  text-align: center;
}

.practice-main h1 {
  font-size: var(--text-hero);
  font-weight: var(--font-weight-heading);
  line-height: var(--line-height-heading);
}

.practice-main p {
  max-width: 32rem;
  color: var(--color-text);
}

.back-link {
  color: var(--color-text-strong);
  font-weight: var(--font-weight-medium);
}

.back-link:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
  border-radius: 4px;
}
</style>
