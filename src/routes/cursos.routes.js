// Rotas de cursos (opções do filtro de curso). Só leitura (RNF08): os dados entram pelo seed.
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { cursoResposta, selectCurso } from '../lib/respostas.js'
import { id } from '../lib/validacao.js'
import { ErroNaoEncontrado } from '../middlewares/erros.js'

const router = Router()

router.get('/', async (req, res) => {
  const cursos = await prisma.curso.findMany({ select: selectCurso, orderBy: { nome: 'asc' } })
  res.json(cursos.map(cursoResposta))
})

router.get('/:id', async (req, res) => {
  const curso = await prisma.curso.findUnique({ where: { id: id(req.params.id) }, select: selectCurso })
  if (!curso) throw new ErroNaoEncontrado('Curso não encontrado.')
  res.json(cursoResposta(curso))
})

export default router
