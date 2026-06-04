import { ref, readonly } from 'vue'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type UserRole = 'user' | 'counsellor'

interface Profile {
  id: string
  role: UserRole
  display_name: string | null
}

const currentUser = ref<User | null>(null)
const currentProfile = ref<Profile | null>(null)
const loading = ref(true)

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, display_name')
    .eq('id', userId)
    .single()
  if (error || !data) return null
  return data as Profile
}

async function init() {
  const { data } = await supabase.auth.getSession()
  const session = data.session
  currentUser.value = session?.user ?? null
  if (currentUser.value) {
    currentProfile.value = await fetchProfile(currentUser.value.id)
  }
  loading.value = false

  supabase.auth.onAuthStateChange(async (_event, session) => {
    currentUser.value = session?.user ?? null
    if (currentUser.value) {
      currentProfile.value = await fetchProfile(currentUser.value.id)
    } else {
      currentProfile.value = null
    }
  })
}

async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

async function signOut() {
  await supabase.auth.signOut()
}

init()

export function useAuth() {
  return {
    user: readonly(currentUser),
    profile: readonly(currentProfile),
    loading: readonly(loading),
    signIn,
    signOut,
  }
}
