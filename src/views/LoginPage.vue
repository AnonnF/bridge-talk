<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import SiteHeader from '@/components/layout/SiteHeader.vue'

const router = useRouter()
const route = useRoute()
const { signIn, profile } = useAuth()

const email = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)
const registered = ref(route.query.registered === '1')

async function handleSubmit() {
  error.value = ''
  submitting.value = true
  try {
    await signIn(email.value, password.value)
    const role = profile.value?.role
    if (role === 'counsellor') {
      router.push({ name: 'counsellor-dashboard' })
    } else {
      router.push({ name: 'home' })
    }
  } catch (e: unknown) {
    error.value =
      e instanceof Error ? e.message : 'Login failed. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <SiteHeader />

    <main class="login-main">
      <div class="login-card">
        <h1 class="login-title">Welcome back</h1>
        <p class="login-subtitle">Sign in to your BridgeTalk account</p>

        <form novalidate class="login-form" @submit.prevent="handleSubmit">
          <div class="form-field">
            <label for="email" class="form-label">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              class="form-input"
              placeholder="you@example.com"
              autocomplete="email"
              required
            />
          </div>

          <div class="form-field">
            <label for="password" class="form-label">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              class="form-input"
              placeholder="••••••••"
              autocomplete="current-password"
              required
            />
          </div>

          <p v-if="error" class="form-error" role="alert">{{ error }}</p>

          <div class="form-footer">
            <RouterLink to="/forgot-password" class="forgot-link"
              >Forgot password?</RouterLink
            >
          </div>

          <button type="submit" class="login-btn" :disabled="submitting">
            {{ submitting ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>

        <p v-if="registered" class="form-success" role="status">
          Account created! You can now sign in.
        </p>

        <p class="signup-link">
          Don't have an account?
          <RouterLink to="/signup">Sign up</RouterLink>
        </p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.login-page {
  position: relative;
  min-height: 100svh;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
}

.login-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6rem var(--space-page-x) var(--space-page-x);
}

.login-card {
  width: 100%;
  max-width: 26rem;
}

.login-title {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: var(--font-weight-heading);
  color: var(--color-text-strong);
  line-height: var(--line-height-heading);
  margin: 0 0 0.5rem;
}

.login-subtitle {
  font-size: var(--text-body);
  color: var(--color-text);
  margin: 0 0 2rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-strong);
}

.form-input {
  padding: 0.625rem 0.875rem;
  border: 1.5px solid var(--color-radio-border);
  border-radius: 8px;
  background: #fff;
  font-size: 1rem;
  font-family: var(--font-sans);
  color: var(--color-text-strong);
  outline: none;
  transition: border-color 0.15s;
}

.form-input:focus {
  border-color: var(--color-text-strong);
}

.form-input::placeholder {
  color: var(--color-radio-border);
}

.form-footer {
  display: flex;
  justify-content: flex-end;
}

.forgot-link {
  font-size: 0.875rem;
  color: var(--color-text);
  text-decoration: none;
}

.forgot-link:hover {
  color: var(--color-text-strong);
  text-decoration: underline;
}

.form-error {
  font-size: 0.875rem;
  color: #c0392b;
  margin: 0;
}

.login-btn {
  margin-top: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-btn-bg);
  color: var(--color-btn-fg);
  border: none;
  border-radius: var(--radius-pill);
  font-size: 1rem;
  font-weight: var(--font-weight-medium);
  font-family: var(--font-sans);
  cursor: pointer;
  transition: opacity 0.15s;
}

.login-btn:hover:not(:disabled) {
  opacity: 0.85;
}

.login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-success {
  font-size: 0.875rem;
  color: #2e7d47;
  margin: 1rem 0 0;
}

.signup-link {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9375rem;
  color: var(--color-text);
}

.signup-link a {
  color: var(--color-text-strong);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
}

.signup-link a:hover {
  text-decoration: underline;
}
</style>
