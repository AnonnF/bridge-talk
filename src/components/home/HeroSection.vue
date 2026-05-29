<script setup lang="ts">
import BaseButton from '../ui/BaseButton.vue'
import IconSpeech from '../ui/IconSpeech.vue'
</script>

<template>
  <section class="hero" aria-labelledby="hero-heading">
    <div class="hero__inner">
      <h1 id="hero-heading" class="hero__title">
        Practice communication before real conversations
      </h1>
      <p class="hero__subtitle">
        BridgeTalk helps you prepare for everyday situations through guided
        scenarios and safe interaction practice.
      </p>
      <BaseButton to="/practice" size="lg" class="hero__cta">
        <IconSpeech />
        Practice now
      </BaseButton>
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

.hero__cta {
  margin-top: calc(var(--space-hero-cta-top) - var(--space-hero-gap));
}
</style>
