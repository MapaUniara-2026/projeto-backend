// Rotas de aulas (contrato 2.1, 2.3 e 2.5). Só leitura (RNF08).
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { consultarAulaPorId, consultarAulas } from '../services/consultas-academicas.js'

const router = Router()

// GET /api/aulas?curso=SI&dia=SEGUNDA&periodo=NOTURNO&sala=BL4-104
router.get('/', async (req, res) => {
  res.json(await consultarAulas(prisma, req.query))
})

// GET /api/aulas/12
router.get('/:id', async (req, res) => {
  res.json(await consultarAulaPorId(prisma, req.params.id))
})

export default router
