// Lista de professores (para montar o filtro ?professor=ID das aulas).
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

router.get('/', async (req, res) => {
  // Só id e nome: o e-mail não é exposto na API pública.
  const professores = await prisma.professor.findMany({
    select: { id: true, nome: true },
    orderBy: { nome: 'asc' },
  })
  res.json(professores)
})

export default router
