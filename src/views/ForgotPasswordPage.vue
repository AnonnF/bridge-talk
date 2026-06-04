<template>
  <div class="forgot-page">
    <main class="forgot-main">
      <div class="forgot-card">
        <div class="forgot-icon" aria-hidden="true">🔒</div>
        <h1 class="forgot-title">Forgot your password?</h1>
        <p class="forgot-body">
          Automated password reset is not available yet. Please contact your
          programme administrator to have your password reset.
        </p>
        <RouterLink to="/login" class="forgot-back">Back to sign in</RouterLink>
      </div>
    </main>
  </div>
</template>

<style scoped>
.forgot-page {
  min-height: 100svh;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
}

.forgot-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem var(--space-page-x);
}

.forgot-card {
  width: 100%;
  max-width: 26rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.forgot-icon {
  font-size: 2.5rem;
  line-height: 1;
}

.forgot-title {
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: var(--font-weight-heading);
  color: var(--color-text-strong);
  margin: 0;
}

.forgot-body {
  font-size: var(--text-body);
  color: var(--color-text);
  line-height: var(--line-height-body);
  margin: 0;
}

.forgot-back {
  margin-top: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-btn-bg);
  color: var(--color-btn-fg);
  border-radius: var(--radius-pill);
  font-size: 1rem;
  font-weight: var(--font-weight-medium);
  font-family: var(--font-sans);
  text-decoration: none;
  transition: opacity 0.15s;
}

.forgot-back:hover {
  opacity: 0.85;
}
</style>
