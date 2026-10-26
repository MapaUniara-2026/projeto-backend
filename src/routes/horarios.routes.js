import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { horarioResposta, selectHorario } from '../lib/respostas.js'
import { diaSemana, id, opcional } from '../lib/validacao.js'
import { ErroApi, ErroNaoEncontrado } from '../middlewares/erros.js'
import { consultarConflitoNoBanco } from '../validators/conflitos-horarios.js'
import { validarCadastroHorario } from '../validators/horarios.js'

const router = Router()

// Consultas simples. As consultas consolidadas de ocupação pertencem ao Otávio.
router.get('/', async (req, res) => {
  const dia = opcional(diaSemana)(req.query.dia, 'dia')
  const salaId = opcional(id)(req.query.salaId, 'salaId')
  const turmaId = opcional(id)(req.query.turmaId, 'turmaId')
  const where = {
    ...(dia ? { diaSemana: dia } : {}),
    ...(salaId ? { salaId } : {}),
    ...(turmaId ? { turmaId } : {}),
  }

  const horarios = await prisma.horario.findMany({
    where,
    select: selectHorario,
    orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }, { id: 'asc' }],
  })
  res.json(horarios.map(horarioResposta))
})

router.get('/:id', async (req, res) => {
  const horario = await prisma.horario.findUnique({
    where: { id: id(req.params.id) },
    select: selectHorario,
  })
  if (!horario) throw new ErroNaoEncontrado('Horário não encontrado.')
  res.json(horarioResposta(horario))
})

// Cadastro sujeito à revisão do time sobre autenticação e escopo de escrita.
router.post('/', async (req, res) => {
  const data = validarCadastroHorario(req.body)
  const conflito = await consultarConflitoNoBanco(prisma, data)

  if (conflito) {
    const tipo = conflito.tipo === 'SALA' ? 'A sala já está ocupada' : 'A turma já possui uma aula'
    throw new ErroApi('CONFLITO', `${tipo} em horário sobreposto neste dia.`)
  }

  const horario = await prisma.horario.create({ data, select: selectHorario })
  res.status(201).json(horarioResposta(horario))
})

export default router
