import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { ErroValidacao } from '../middlewares/erros.js'

const router = Router()

router.get('/', async (req, res) => {
  const salas = await prisma.sala.findMany({ orderBy: { codigo: 'asc' } })
  res.json(salas)
})

router.post('/', async (req, res) => {
  const { codigo, bloco, capacidade } = req.body
  if (!codigo?.trim() || !Number.isInteger(capacidade) || capacidade <= 0) {
    throw new ErroValidacao('Informe "codigo" e uma "capacidade" inteira maior que zero.')
  }
  const sala = await prisma.sala.create({ data: { codigo: codigo.trim(), bloco, capacidade } })
  res.status(201).json(sala)
})

export default router
