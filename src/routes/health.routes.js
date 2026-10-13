import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

// GET /api/health — usado pelo front e pelo workflow que mantém o Supabase ativo.
router.get('/', async (req, res) => {
  const resposta = { status: 'ok', ambiente: process.env.APP_ENV ?? 'LOCAL', banco: 'ok' }
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch (err) {
    console.error('Falha ao conectar no banco:', err.message)
    return res.status(503).json({ ...resposta, status: 'degradado', banco: 'indisponível' })
  }
  res.json(resposta)
})

export default router
