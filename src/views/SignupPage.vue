<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import SiteHeader from '@/components/layout/SiteHeader.vue'

const router = useRouter()

const displayName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const role = ref<'user' | 'counsellor'>('user')
const inviteCode = ref('')
const error = ref('')
const submitting = ref(false)

const isCounsellor = computed(() => role.value === 'counsellor')

async function handleSubmit() {
  error.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters.'
    return
  }

  submitting.value = true
  try {
    if (isCounsellor.value) {
      await signUpCounsellor()
    } else {
      await signUpUser()
    }
    router.push({ name: 'login', query: { registered: '1' } })
  } catch (e: unknown) {
    error.value =
      e instanceof Error ? e.message : 'Sign up failed. Please try again.'
  } finally {
    submitting.value = false
  }
}

async function signUpUser() {
  const { error: authError } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: {
      data: { role: 'user', display_name: displayName.value },
    },
  })
  if (authError) throw authError
}

async function signUpCounsellor() {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? ''
  const res = await fetch(`${apiBase}/api/auth/counsellor-signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.value,
      password: password.value,
      displayName: displayName.value,
      inviteCode: inviteCode.value,
    }),
  })
  const body = (await res.json()) as { error?: string }
  if (!res.ok) {
    throw new Error(body.error ?? 'Sign up failed.')
  }
}
</script>

<template>
  <div class="signup-page">
    <SiteHeader />

    <main class="signup-main">
      <div class="signup-card">
        <h1 class="signup-title">Create an account</h1>
        <p class="signup-subtitle">Join BridgeTalk to start practising</p>

        <form novalidate class="signup-form" @submit.prevent="handleSubmit">
          <div class="form-field">
            <label for="displayName" class="form-label">Name</label>
            <input
              id="displayName"
              v-model="displayName"
              type="text"
              class="form-input"
              placeholder="Your name"
              autocomplete="name"
              required
            />
          </div>

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
              placeholder="At least 6 characters"
              autocomplete="new-password"
              required
            />
          </div>

          <div class="form-field">
            <label for="confirmPassword" class="form-label"
              >Confirm password</label
            >
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              class="form-input"
              placeholder="••••••••"
              autocomplete="new-password"
              required
            />
          </div>

          <div class="form-field">
            <span class="form-label">I am a…</span>
            <div class="role-options">
              <label
                class="role-option"
                :class="{ 'role-option--active': role === 'user' }"
              >
                <input
                  v-model="role"
                  type="radio"
                  value="user"
                  class="role-radio"
                />
                <span class="role-option__title">Learner</span>
                <span class="role-option__desc"
                  >Practise communication skills</span
                >
              </label>
              <label
                class="role-option"
                :class="{ 'role-option--active': role === 'counsellor' }"
              >
                <input
                  v-model="role"
                  type="radio"
                  value="counsellor"
                  class="role-radio"
                />
                <span class="role-option__title">Counsellor</span>
                <span class="role-option__desc"
                  >Support and review learners</span
                >
              </label>
            </div>
          </div>

          <div v-if="isCounsellor" class="form-field">
            <label for="inviteCode" class="form-label">Invite code</label>
            <input
              id="inviteCode"
              v-model="inviteCode"
              type="text"
              class="form-input"
              placeholder="Enter your counsellor invite code"
              autocomplete="off"
              required
            />
            <span class="form-hint"
              >Contact your administrator for the invite code.</span
            >
          </div>

          <p v-if="error" class="form-error" role="alert">{{ error }}</p>

          <button type="submit" class="signup-btn" :disabled="submitting">
            {{ submitting ? 'Creating account…' : 'Create account' }}
          </button>
        </form>

        <p class="login-link">
          Already have an account?
          <RouterLink to="/login">Sign in</RouterLink>
        </p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.signup-page {
  position: relative;
  min-height: 100svh;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
}

.signup-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6rem var(--space-page-x) var(--space-page-x);
}

.signup-card {
  width: 100%;
  max-width: 26rem;
}

.signup-title {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: var(--font-weight-heading);
  color: var(--color-text-strong);
  line-height: var(--line-height-heading);
  margin: 0 0 0.5rem;
}

.signup-subtitle {
  font-size: var(--text-body);
  color: var(--color-text);
  margin: 0 0 2rem;
}

.signup-form {
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

.form-hint {
  font-size: 0.8125rem;
  color: var(--color-text);
}

.role-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.role-option {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.875rem;
  border: 1.5px solid var(--color-radio-border);
  border-radius: 8px;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
}

.role-option--active {
  border-color: var(--color-text-strong);
  background: var(--color-surface-muted);
}

.role-radio {
  display: none;
}

.role-option__title {
  font-size: 0.9375rem;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-strong);
}

.role-option__desc {
  font-size: 0.8125rem;
  color: var(--color-text);
  line-height: 1.4;
}

.form-error {
  font-size: 0.875rem;
  color: #c0392b;
  margin: 0;
}

.signup-btn {
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

.signup-btn:hover:not(:disabled) {
  opacity: 0.85;
}

.signup-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-link {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9375rem;
  color: var(--color-text);
}

.login-link a {
  color: var(--color-text-strong);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>
