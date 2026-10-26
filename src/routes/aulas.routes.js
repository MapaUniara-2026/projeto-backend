// Rotas de aulas (contrato 2.1, 2.3 e 2.5). Só leitura (RNF08).
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { DIAS, PERIODOS, formatarHora, validarOpcao } from '../lib/horarios.js'

const router = Router()

// O que vem de cada relação (2.1): só o necessário para a tela, sem ids internos nem datas de auditoria.
export const SELECT_AULA = {
  id: true,
  diaSemana: true,
  periodo: true,
  horaInicio: true,
  horaTermino: true,
  sala: { select: { codigo: true, nome: true, andar: true } },
  curso: { select: { sigla: true, nome: true } },
  disciplina: { select: { nome: true } },
  professor: { select: { nome: true } },
  turma: { select: { nome: true, semestre: true } },
}

// O banco devolve TIME como Date; o contrato pede "HH:MM".
export function formatarAula(aula) {
  return {
    ...aula,
    horaInicio: formatarHora(aula.horaInicio),
    horaTermino: formatarHora(aula.horaTermino),
  }
}

// GET /api/aulas?curso=SI&dia=SEGUNDA&periodo=NOTURNO&sala=BL4-104
router.get('/', async (req, res) => {
  const { curso, dia, periodo, sala } = req.query
  const where = {}

  if (curso) where.curso = { sigla: String(curso).toUpperCase() }
  if (sala) where.sala = { codigo: String(sala).toUpperCase() }
  if (dia) where.diaSemana = validarOpcao(dia, DIAS, 'dia')
  if (periodo) where.periodo = validarOpcao(periodo, PERIODOS, 'periodo')

  const aulas = await prisma.aula.findMany({
    where,
    select: SELECT_AULA,
    // O enum segue a ordem em que foi declarado: SEGUNDA, TERCA, ... SEXTA.
    orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
  })
  res.json(aulas.map(formatarAula))
})

export default router
