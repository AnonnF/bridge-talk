import cors from 'cors'
import express from 'express'
import { createScenariosRouter } from './routes/scenarios.js'

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    }),
  )
  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.use('/api', createScenariosRouter())

  return app
}
