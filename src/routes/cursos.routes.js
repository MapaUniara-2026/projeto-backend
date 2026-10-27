// GET /api/cursos — opções do filtro de curso no front-end (contrato, seção 2.3).
// Documentação: docs/API.md#get-apicursos
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

router.get('/', async (req, res) => {
  const cursos = await prisma.curso.findMany({
    select: { codigo: true, nome: true }, // só o que o filtro usa; sem id e datas internas
    orderBy: { nome: 'asc' },
  })
  // A lista muda raramente: o navegador pode reaproveitar a resposta por 5 minutos.
  res.set('Cache-Control', 'public, max-age=300')
  res.json(cursos)
})

export default router
