<script setup lang="ts">
import HeroSection from '../components/home/HeroSection.vue'
import SiteHeader from '../components/layout/SiteHeader.vue'
</script>

<template>
  <div class="home-page">
    <SiteHeader />
    <HeroSection />
  </div>
</template>

<style scoped>
.home-page {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100svh;
  background: var(--color-bg);
}
</style>
