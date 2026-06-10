<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const { user, profile, signOut } = useAuth()
const router = useRouter()
const open = ref(false)
const isCounsellor = computed(() => profile.value?.role === 'counsellor')

async function handleSignOut() {
  open.value = false
  await signOut()
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="site-header">
    <div class="site-header__inner">
      <RouterLink to="/" class="logo">BridgeTalk</RouterLink>
      <nav class="site-nav">
        <template v-if="isCounsellor">
          <RouterLink to="/counsellor" class="site-nav__link"
            >Dashboard</RouterLink
          >
        </template>
        <template v-else>
          <RouterLink to="/learn" class="site-nav__link">Learn</RouterLink>
          <RouterLink to="/chat" class="site-nav__link">Chat</RouterLink>
          <RouterLink to="/reflect" class="site-nav__link">Journal</RouterLink>
        </template>
      </nav>

      <div v-if="user" class="avatar-wrapper">
        <button
          class="site-header__avatar"
          :aria-expanded="open"
          aria-haspopup="true"
          aria-label="Account menu"
          @click="open = !open"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </button>

        <div v-if="open" class="avatar-dropdown" role="menu">
          <p v-if="profile?.display_name" class="avatar-dropdown__name">
            {{ profile.display_name }}
          </p>
          <button
            class="avatar-dropdown__signout"
            role="menuitem"
            @click="handleSignOut"
          >
            Sign out
          </button>
        </div>

        <div v-if="open" class="avatar-backdrop" @click="open = false" />
      </div>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  position: absolute;
  inset: 0 0 auto;
  z-index: 10;
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

.site-nav {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.site-nav__link {
  font-size: var(--text-body);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  text-decoration: none;
  transition: color 0.15s;
}

.site-nav__link:hover,
.site-nav__link.router-link-active {
  color: var(--color-text-strong);
}

.avatar-wrapper {
  position: relative;
}

.site-header__avatar {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: var(--color-surface, #e8f0eb);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text);
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}

.site-header__avatar:hover {
  background: var(--color-surface-muted);
}

.avatar-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 10rem;
  background: #fff;
  border: 1.5px solid var(--color-surface-muted);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  z-index: 20;
}

.avatar-dropdown__name {
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-strong);
  margin: 0;
  border-bottom: 1px solid var(--color-surface-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.avatar-dropdown__signout {
  display: block;
  width: 100%;
  padding: 0.625rem 1rem;
  text-align: left;
  background: none;
  border: none;
  font-size: 0.875rem;
  font-family: var(--font-sans);
  color: var(--color-text);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}

.avatar-dropdown__signout:hover {
  background: var(--color-bg);
  color: var(--color-text-strong);
}

.avatar-backdrop {
  position: fixed;
  inset: 0;
  z-index: 19;
}
</style>
