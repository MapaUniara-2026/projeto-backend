// TODO(RNF08): o POST está aberto a qualquer um; combinar com o time se sai ou ganha autenticação.
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { salaResposta, selectSala } from '../lib/respostas.js'
import { codigoSala, corpo, inteiro, opcional, texto } from '../lib/validacao.js'

const router = Router()

router.get('/', async (req, res) => {
  const salas = await prisma.sala.findMany({ select: selectSala, orderBy: { codigo: 'asc' } })
  res.json(salas.map(salaResposta))
})

router.post('/', async (req, res) => {
  const { codigo, bloco, capacidade } = corpo(req.body)
  const data = {
    codigo: codigoSala(codigo),
    bloco: opcional(texto)(bloco, 'bloco', { max: 20 }),
    capacidade: inteiro(capacidade, 'capacidade', { min: 1 }),
  }
  const sala = await prisma.sala.create({ data, select: selectSala })
  res.status(201).json(salaResposta(sala))
})

export default router
