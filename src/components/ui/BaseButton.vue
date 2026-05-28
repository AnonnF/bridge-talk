<script setup lang="ts">
withDefaults(
  defineProps<{
    to?: string
    href?: string
    size?: 'sm' | 'lg'
  }>(),
  {
    to: undefined,
    href: undefined,
    size: 'lg',
  },
)
</script>

<template>
  <RouterLink v-if="to" :to="to" class="btn" :class="size">
    <slot />
  </RouterLink>
  <a v-else-if="href" :href="href" class="btn" :class="size">
    <slot />
  </a>
  <button v-else type="button" class="btn" :class="size">
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--color-btn-bg);
  color: var(--color-btn-fg);
  font-family: var(--font-sans);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.btn:hover {
  opacity: 0.9;
}

.btn:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

.btn.sm {
  padding: 0.5625rem 1.25rem;
  font-size: 0.9375rem;
  line-height: 1.5;
}

.btn.lg {
  padding: 1rem 2rem;
  font-size: 1rem;
  line-height: 1.5;
  min-height: 3.75rem;
}
</style>
