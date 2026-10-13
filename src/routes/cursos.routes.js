// CRUD completo de cursos — use como modelo para as outras entidades.
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { ErroValidacao } from '../middlewares/erros.js'

const router = Router()

function validar({ codigo, nome }) {
  if (!codigo?.trim() || !nome?.trim()) {
    throw new ErroValidacao('Os campos "codigo" e "nome" são obrigatórios.')
  }
  return { codigo: codigo.trim(), nome: nome.trim() }
}

router.get('/', async (req, res) => {
  const cursos = await prisma.curso.findMany({ orderBy: { nome: 'asc' } })
  res.json(cursos)
})

router.get('/:id', async (req, res) => {
  const curso = await prisma.curso.findUniqueOrThrow({
    where: { id: Number(req.params.id) },
    include: { turmas: true },
  })
  res.json(curso)
})

router.post('/', async (req, res) => {
  const curso = await prisma.curso.create({ data: validar(req.body) })
  res.status(201).json(curso)
})

router.put('/:id', async (req, res) => {
  const curso = await prisma.curso.update({
    where: { id: Number(req.params.id) },
    data: validar(req.body),
  })
  res.json(curso)
})

router.delete('/:id', async (req, res) => {
  // Se o curso tiver turmas, o banco recusa (onDelete: Restrict) e a API responde 409.
  await prisma.curso.delete({ where: { id: Number(req.params.id) } })
  res.status(204).end()
})

export default router
