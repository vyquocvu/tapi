import type { VercelRequest, VercelResponse } from '@vercel/node'
import express from 'express'
import cors from 'cors'
import todosRouter from '../server/routes/todos.js'

const app = express()

app.use(cors())
app.use(express.json())

// Routes
app.use('/api/todos', todosRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Export as Vercel serverless function
export default (req: VercelRequest, res: VercelResponse) => {
  return app(req as any, res as any)
}
