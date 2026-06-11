import {
  createClient,
  type SupabaseClient,
  type User,
} from '@supabase/supabase-js'
import type { Request } from 'express'
import type { Database } from '../types/database.js'

type AdminClient = SupabaseClient<Database>

let adminClient: AdminClient | null = null

async function ensureProfileExists(user: User): Promise<void> {
  const client = getAdminClient()
  const { data, error } = await client
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (data) {
    return
  }

  const displayNameFromMetadata = user.user_metadata?.display_name
  const displayName =
    typeof displayNameFromMetadata === 'string' &&
    displayNameFromMetadata.trim()
      ? displayNameFromMetadata.trim()
      : (user.email ?? 'Learner')

  const role = user.user_metadata?.role === 'counsellor' ? 'counsellor' : 'user'

  const { error: insertError } = await client.from('profiles').insert({
    id: user.id,
    role,
    display_name: displayName,
  })

  if (insertError) {
    throw insertError
  }
}

export function getAdminClient(): AdminClient {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase admin credentials not configured')
  }

  adminClient ??= createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  return adminClient
}

function bearerTokenFromHeader(header: string | undefined): string | null {
  if (!header) return null

  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null
  }

  return token
}

export async function getUserFromRequest(req: Request): Promise<User | null> {
  const token = bearerTokenFromHeader(req.headers.authorization)
  if (!token) return null

  const { data, error } = await getAdminClient().auth.getUser(token)
  if (error || !data.user) return null

  console.log(`[auth] token resolved to user id=${data.user.id}`)
  try {
    console.log(`[auth] ensuring profile exists for user id=${data.user.id}`)
    await ensureProfileExists(data.user)
    console.log(`[auth] profile ensured for user id=${data.user.id}`)
  } catch (e) {
    console.error('[auth] error ensuring profile:', e)
    throw e
  }

  return data.user
}
