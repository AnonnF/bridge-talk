import { Router } from 'express'
import { getAdminClient } from '../services/supabase.js'

export function createAuthRouter() {
  const router = Router()

  router.post('/auth/counsellor-signup', async (req, res) => {
    const { email, password, displayName, inviteCode } = req.body as {
      email?: unknown
      password?: unknown
      displayName?: unknown
      inviteCode?: unknown
    }

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof displayName !== 'string' ||
      typeof inviteCode !== 'string'
    ) {
      res.status(400).json({ error: 'Missing required fields' })
      return
    }

    const expectedCode = process.env.COUNSELLOR_INVITE_CODE
    if (!expectedCode || inviteCode !== expectedCode) {
      res.status(403).json({ error: 'Invalid invite code' })
      return
    }

    try {
      const adminClient = getAdminClient()
      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        user_metadata: { role: 'counsellor', display_name: displayName },
        email_confirm: true,
      })

      if (error) {
        res.status(400).json({ error: error.message })
        return
      }

      res.json({ userId: data.user.id })
    } catch {
      res.status(500).json({ error: 'Server configuration error' })
    }
  })

  return router
}
