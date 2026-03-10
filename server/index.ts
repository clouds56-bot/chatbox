import express, { Request, Response } from 'express'
import cors from 'cors'
import { oauthRouter } from './routes/oauth'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))

app.use(express.json())

app.use('/api/oauth', oauthRouter)

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`OAuth server running on port ${PORT}`)
})
