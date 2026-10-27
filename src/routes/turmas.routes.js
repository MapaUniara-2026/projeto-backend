// Consulta de turmas. Ex.: GET /api/turmas?curso=ES&semestre=2026.2
import { Router } from 'express'
import { filtroCodigo, filtroId } from '../lib/filtros.js'
import { prisma } from '../lib/prisma.js'

const router = Router()

router.get('/', async (req, res) => {
  const curso = filtroCodigo(req.query, 'curso')
  const semestre = filtroCodigo(req.query, 'semestre')
  const professor = filtroId(req.query, 'professor')

  const turmas = await prisma.turma.findMany({
    where: { semestre, professorId: professor, curso: curso ? { codigo: curso } : undefined },
    select: {
      id: true,
      codigo: true,
      semestre: true,
      curso: { select: { codigo: true, nome: true } },
      professor: { select: { id: true, nome: true } },
    },
    orderBy: [{ semestre: 'desc' }, { codigo: 'asc' }],
  })
  res.json(turmas)
})

export default router
