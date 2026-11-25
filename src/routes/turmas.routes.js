// Rotas de turmas (opções do filtro de turma). Só leitura (RNF08).
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { consultarTurmas } from '../services/cadastros.js'

const router = Router()

// GET /api/turmas?curso=SI&semestre=6
router.get('/', async (req, res) => {
  res.json(await consultarTurmas(prisma, req.query))
})

export default router
