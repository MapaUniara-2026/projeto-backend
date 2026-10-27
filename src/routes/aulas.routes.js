import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { consultarAulaPorId, consultarAulas } from '../services/consultas-academicas.js'

const router = Router()

router.get('/', async (req, res) => {
  const aulas = await consultarAulas(prisma, req.query)
  res.json(aulas)
})

router.get('/:id', async (req, res) => {
  const aula = await consultarAulaPorId(prisma, req.params.id)
  res.json(aula)
})

export default router
