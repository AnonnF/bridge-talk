<script setup lang="ts">
import { onMounted } from 'vue'
import BaseButton from '../ui/BaseButton.vue'
import { useAuth } from '../../composables/useAuth'

const { initializeAuth, isAuthenticated, loading, signOut, user } = useAuth()

onMounted(() => {
  void initializeAuth()
})

async function handleSignOut() {
  await signOut()
}
</script>

<template>
  <header class="site-header">
    <div class="site-header__inner">
      <RouterLink to="/" class="logo">BridgeTalk</RouterLink>
      <div class="site-header__actions">
        <BaseButton to="/practice" size="sm">Start Practicing</BaseButton>
        <BaseButton v-if="!loading && !isAuthenticated" to="/login" size="sm">Sign in</BaseButton>
        <button v-else-if="!loading && isAuthenticated" type="button" class="auth-chip" @click="handleSignOut">
          {{ user?.email ?? 'Sign out' }}
        </button>
      </div>
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
  gap: 1rem;
}

.site-header__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
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

.auth-chip {
  border: 1px solid rgba(61, 69, 65, 0.16);
  border-radius: var(--radius-pill);
  padding: 0.5625rem 1rem;
  background: rgba(250, 248, 245, 0.9);
  color: var(--color-text-strong);
  font: inherit;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
}

.auth-chip:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}
</style>
