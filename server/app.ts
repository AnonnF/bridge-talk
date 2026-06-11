import cors from 'cors'
import express from 'express'
import { createAuthRouter } from './routes/auth.js'
import { createChatRouter } from './routes/chat.js'
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

  // Log incoming requests for easier debugging in local dev
  app.use((req, _res, next) => {
    console.log(`[API] ${req.method} ${req.originalUrl}`)
    next()
  })

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.use('/api', createAuthRouter())
  app.use('/api', createChatRouter())
  app.use('/api', createScenariosRouter())

  return app
}
