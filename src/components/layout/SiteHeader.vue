<script setup lang="ts">
import BaseButton from '../ui/BaseButton.vue'
</script>

<template>
  <header class="site-header">
    <div class="site-header__inner">
      <RouterLink to="/" class="logo">BridgeTalk</RouterLink>
      <BaseButton to="/practice" size="sm">Start Practicing</BaseButton>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  position: absolute;
  inset: 0 0 auto;
  z-index: 1;
  width: 100%;
  max-width: var(--max-content);
  margin-inline: auto;
  padding: var(--space-header-y) var(--space-page-x);
  pointer-events: none;
}

.site-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: auto;
}

.logo {
  font-family: var(--font-logo);
  font-size: var(--text-logo);
  font-weight: 400;
  line-height: 1.75rem;
  color: var(--color-text-strong);
  text-decoration: none;
}

.logo:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
  border-radius: 4px;
}
</style>
