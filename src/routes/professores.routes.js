// Rotas de professores (opções do filtro de professor). Só leitura (RNF08).
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { consultarProfessores } from '../services/cadastros.js'

const router = Router()

// GET /api/professores?curso=SI
router.get('/', async (req, res) => {
  res.json(await consultarProfessores(prisma, req.query))
})

export default router
