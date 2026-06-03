<script setup lang="ts"></script>

<template>
  <header class="site-header">
    <div class="site-header__inner">
      <RouterLink to="/" class="logo">BridgeTalk</RouterLink>
      <nav class="site-nav">
        <RouterLink to="/learn" class="site-nav__link">Learn</RouterLink>
        <RouterLink to="/practice" class="site-nav__link">Practise</RouterLink>
        <RouterLink to="/reflect" class="site-nav__link">Journal</RouterLink>
      </nav>
      <div class="site-header__avatar" aria-hidden="true">
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
  color: var(--color-text);
  text-decoration: none;
  transition: color 0.15s;
}

.site-nav__link:hover,
.site-nav__link.router-link-active {
  color: var(--color-text-strong);
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
}
</style>
