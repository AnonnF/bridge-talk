<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '../components/ui/BaseButton.vue'
import SiteHeader from '../components/layout/SiteHeader.vue'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { initializeAuth, isAuthenticated, isConfigured, loading, signInWithPassword, signOut, signUpWithPassword, user } = useAuth()

const email = ref('')
const password = ref('')
const authMode = ref<'sign-in' | 'sign-up'>('sign-in')
const isSubmitting = ref(false)
const feedback = ref('')
const errorMessage = ref('')

const title = computed(() => (authMode.value === 'sign-in' ? 'Welcome back' : 'Create your account'))
const buttonLabel = computed(() => (authMode.value === 'sign-in' ? 'Sign in' : 'Create account'))
const toggleLabel = computed(() =>
  authMode.value === 'sign-in' ? 'Need an account? Create one' : 'Already have an account? Sign in',
)

onMounted(() => {
  void initializeAuth()
})

async function submitForm() {
  errorMessage.value = ''
  feedback.value = ''

  if (!isConfigured) {
    errorMessage.value = 'Set the Supabase environment variables first.'
    return
  }

  isSubmitting.value = true

  try {
    if (authMode.value === 'sign-in') {
      await signInWithPassword(email.value, password.value)
      feedback.value = 'Signed in successfully.'
    } else {
      await signUpWithPassword(email.value, password.value)
      feedback.value = 'Account created. Check your email if confirmation is enabled.'
    }

    await router.push('/')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Authentication failed.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleSignOut() {
  errorMessage.value = ''

  try {
    await signOut()
    feedback.value = 'Signed out.'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not sign out.'
  }
}
</script>

<template>
  <div class="login-page">
    <SiteHeader />

    <main class="login-shell">
      <section class="login-intro" aria-labelledby="login-heading">
        <p class="eyebrow">Supabase auth</p>
        <h1 id="login-heading">{{ title }}</h1>
        <p class="subtitle">
          Use your Supabase project to keep sign-in simple while the app stays lightweight.
        </p>
        <div class="status-card">
          <p class="status-label">Current session</p>
          <p v-if="loading">Checking authentication state...</p>
          <p v-else-if="isAuthenticated && user">Signed in as {{ user.email }}</p>
          <p v-else>Not signed in yet.</p>
        </div>
      </section>

      <section class="login-card" aria-label="Authentication form">
        <p v-if="!isConfigured" class="config-warning">
          Add your Supabase URL and anon key to the environment before using the form.
        </p>

        <form class="login-form" @submit.prevent="submitForm">
          <label>
            <span>Email</span>
            <input v-model="email" type="email" autocomplete="email" placeholder="you@example.com" required />
          </label>

          <label>
            <span>Password</span>
            <input
              v-model="password"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••"
              required
            />
          </label>

          <p v-if="feedback" class="feedback success">{{ feedback }}</p>
          <p v-if="errorMessage" class="feedback error">{{ errorMessage }}</p>

          <BaseButton size="lg" type="submit" class="submit-button" :disabled="isSubmitting || !isConfigured">
            {{ isSubmitting ? 'Working...' : buttonLabel }}
          </BaseButton>
        </form>

        <div class="card-footer">
          <button type="button" class="mode-toggle" @click="authMode = authMode === 'sign-in' ? 'sign-up' : 'sign-in'">
            {{ toggleLabel }}
          </button>
          <button v-if="isAuthenticated" type="button" class="signout-link" @click="handleSignOut">Sign out</button>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.login-page {
  position: relative;
  min-height: 100svh;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(61, 69, 65, 0.08), transparent 32%),
    radial-gradient(circle at bottom right, rgba(111, 105, 98, 0.12), transparent 28%),
    var(--color-bg);
}

.login-shell {
  width: 100%;
  max-width: var(--max-content);
  min-height: 100svh;
  margin-inline: auto;
  padding: clamp(7.5rem, 18vh, 10rem) var(--space-page-x) 4rem;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(20rem, 0.95fr);
  gap: clamp(2rem, 4vw, 4rem);
  align-items: center;
}

.login-intro {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 36rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.78rem;
  color: var(--color-text);
}

.login-intro h1 {
  font-size: var(--text-hero);
  line-height: var(--line-height-heading);
  letter-spacing: var(--text-hero-tracking);
  color: var(--color-text-strong);
}

.subtitle {
  max-width: 31rem;
  font-size: var(--text-body);
  line-height: var(--line-height-body);
  color: var(--color-text);
}

.status-card,
.login-card {
  border: 1px solid rgba(61, 69, 65, 0.12);
  border-radius: 1.5rem;
  background: rgba(250, 248, 245, 0.82);
  backdrop-filter: blur(12px);
  box-shadow: 0 24px 80px rgba(61, 69, 65, 0.1);
}

.status-card {
  display: grid;
  gap: 0.375rem;
  width: fit-content;
  padding: 1rem 1.25rem;
}

.status-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-text);
}

.login-card {
  padding: clamp(1.5rem, 3vw, 2rem);
}

.config-warning {
  margin-bottom: 1rem;
  padding: 0.875rem 1rem;
  border-radius: 1rem;
  background: rgba(61, 69, 65, 0.08);
  color: var(--color-text-strong);
}

.login-form {
  display: grid;
  gap: 1rem;
}

.login-form label {
  display: grid;
  gap: 0.45rem;
  color: var(--color-text-strong);
  font-weight: var(--font-weight-medium);
}

.login-form span {
  font-size: 0.95rem;
}

.login-form input {
  width: 100%;
  border: 1px solid rgba(61, 69, 65, 0.16);
  border-radius: 1rem;
  padding: 0.95rem 1rem;
  background: rgba(255, 255, 255, 0.7);
  color: var(--color-text-strong);
  font: inherit;
}

.login-form input::placeholder {
  color: rgba(111, 105, 98, 0.72);
}

.login-form input:focus-visible {
  outline: var(--focus-ring);
  outline-offset: 2px;
}

.submit-button {
  width: 100%;
}

.feedback {
  border-radius: 1rem;
  padding: 0.85rem 1rem;
  font-size: 0.95rem;
}

.feedback.success {
  background: rgba(61, 69, 65, 0.08);
  color: var(--color-text-strong);
}

.feedback.error {
  background: rgba(120, 63, 54, 0.08);
  color: #7a3b30;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.mode-toggle,
.signout-link {
  border: none;
  padding: 0;
  background: transparent;
  color: var(--color-text-strong);
  font: inherit;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 0.18em;
}

.mode-toggle:focus-visible,
.signout-link:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
  border-radius: 4px;
}

@media (max-width: 56rem) {
  .login-shell {
    grid-template-columns: 1fr;
    align-content: start;
    padding-top: 7rem;
  }
}
</style>