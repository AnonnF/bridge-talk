import cors from 'cors'
import express from 'express'
import { createAuthRouter } from './routes/auth.js'
import { createScenariosRouter } from './routes/scenarios.js'

export function createApp() {
  const app = express()

  const corsOrigin =
    process.env.CORS_ORIGIN ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:5173')

  app.use(
    cors({
      origin: corsOrigin,
    }),
  )
  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.use('/api', createAuthRouter())
  app.use('/api', createScenariosRouter())

  return app
}
