import { computed, ref } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase'

const session = ref<Session | null>(null)
const loading = ref(isSupabaseConfigured)
let initialized = false

async function initializeAuth() {
  if (initialized) {
    return
  }

  initialized = true

  if (!isSupabaseConfigured) {
    loading.value = false
    return
  }

  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    console.error(error)
  }

  session.value = data.session
  loading.value = false

  supabase.auth.onAuthStateChange((_event, nextSession) => {
    session.value = nextSession
    loading.value = false
  })
}

async function signInWithPassword(email: string, password: string) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }
}

async function signUpWithPassword(email: string, password: string) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    throw error
  }
}

async function signOut() {
  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}

export function useAuth() {
  return {
    initializeAuth,
    isConfigured: isSupabaseConfigured,
    isAuthenticated: computed(() => Boolean(session.value?.user)),
    loading,
    session,
    signInWithPassword,
    signOut,
    signUpWithPassword,
    user: computed(() => session.value?.user ?? null),
  }
}