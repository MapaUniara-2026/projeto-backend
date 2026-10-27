// Opções para montar a tela de filtros (curso, bloco e sala).
// GET /api/filtros
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

router.get('/', async (req, res) => {
  // Duas consultas em paralelo. Os blocos saem da lista de salas, sem uma terceira ida ao banco.
  const [cursos, salas] = await Promise.all([
    prisma.curso.findMany({ select: { codigo: true, nome: true }, orderBy: { nome: 'asc' } }),
    prisma.sala.findMany({ select: { codigo: true, bloco: true }, orderBy: { codigo: 'asc' } }),
  ])
  const blocos = [...new Set(salas.map((s) => s.bloco).filter(Boolean))].sort()

  // Cadastro muda pouco: pode ficar em cache por mais tempo que as aulas.
  res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  res.json({ cursos, blocos, salas })
})

export default router
