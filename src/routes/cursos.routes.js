// CRUD completo de cursos — use como modelo para as outras entidades.
// TODO(RNF08): POST/PUT/DELETE estão abertos a qualquer um; combinar com o time se saem ou ganham autenticação.
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { cursoDetalheResposta, cursoResposta, selectCurso, selectCursoDetalhe } from '../lib/respostas.js'
import { corpo, id, siglaCurso, texto } from '../lib/validacao.js'
import { ErroNaoEncontrado } from '../middlewares/erros.js'

const router = Router()

function validar(body) {
  const { codigo, nome } = corpo(body)
  return { codigo: siglaCurso(codigo, 'codigo'), nome: texto(nome, 'nome', { max: 120 }) }
}

router.get('/', async (req, res) => {
  const cursos = await prisma.curso.findMany({ select: selectCurso, orderBy: { nome: 'asc' } })
  res.json(cursos.map(cursoResposta))
})

router.get('/:id', async (req, res) => {
  const curso = await prisma.curso.findUnique({ where: { id: id(req.params.id) }, select: selectCursoDetalhe })
  if (!curso) throw new ErroNaoEncontrado('Curso não encontrado.')
  res.json(cursoDetalheResposta(curso))
})

router.post('/', async (req, res) => {
  const curso = await prisma.curso.create({ data: validar(req.body), select: selectCurso })
  res.status(201).json(cursoResposta(curso))
})

router.put('/:id', async (req, res) => {
  const curso = await prisma.curso.update({
    where: { id: id(req.params.id) },
    data: validar(req.body),
    select: selectCurso,
  })
  res.json(cursoResposta(curso))
})

router.delete('/:id', async (req, res) => {
  // Se o curso tiver turmas, o banco recusa (onDelete: Restrict) e a API responde 409.
  await prisma.curso.delete({ where: { id: id(req.params.id) } })
  res.status(204).end()
})

export default router
