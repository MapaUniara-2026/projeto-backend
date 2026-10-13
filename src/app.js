import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { tratarErros } from './middlewares/erros.js'
import cursosRoutes from './routes/cursos.routes.js'
import healthRoutes from './routes/health.routes.js'
import salasRoutes from './routes/salas.routes.js'

const app = express()

// CORS_ORIGIN aceita várias origens separadas por vírgula (URL do front de cada ambiente).
// Use * para os previews da Vercel, ex.: https://projeto-front-*-mapauniara-2026.vercel.app
const origens = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)
  .map((o) => new RegExp(`^${o.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[a-z0-9-]+')}$`))
app.use(cors({ origin: origens }))
app.use(express.json())

app.get('/', (req, res) => res.json({ mensagem: 'API do Projeto da Faculdade' }))
app.use('/api/health', healthRoutes)
app.use('/api/cursos', cursosRoutes)
app.use('/api/salas', salasRoutes)

app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada' }))
app.use(tratarErros)

// A Vercel usa este export default (cada requisição vira uma função serverless).
// Localmente, quem sobe o servidor é o src/local.js.
export default app
