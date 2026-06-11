import {
  createClient,
  type SupabaseClient,
  type User,
} from '@supabase/supabase-js'
import type { Request } from 'express'
import type { Database } from '../types/database.js'

type AdminClient = SupabaseClient<Database>

let adminClient: AdminClient | null = null

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

  return data.user
}
