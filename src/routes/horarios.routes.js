// Registros de horário = linhas da tabela aulas, com os ids das relações.
// Para a tela, use /api/aulas (contrato 2.1). Só leitura (RNF08): os dados entram pelo seed.
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { horarioResposta, selectHorario } from '../lib/respostas.js'
import { diaSemana, id, opcional } from '../lib/validacao.js'
import { ErroNaoEncontrado } from '../middlewares/erros.js'

const router = Router()

router.get('/', async (req, res) => {
  const dia = opcional(diaSemana)(req.query.dia, 'dia')
  const salaId = opcional(id)(req.query.salaId, 'salaId')
  const turmaId = opcional(id)(req.query.turmaId, 'turmaId')
  const where = {
    ...(dia ? { diaSemana: dia } : {}),
    ...(salaId ? { salaId } : {}),
    ...(turmaId ? { turmaId } : {}),
  }

  const aulas = await prisma.aula.findMany({
    where,
    select: selectHorario,
    orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }, { id: 'asc' }],
  })
  res.json(aulas.map(horarioResposta))
})

router.get('/:id', async (req, res) => {
  const aula = await prisma.aula.findUnique({
    where: { id: id(req.params.id) },
    select: selectHorario,
  })
  if (!aula) throw new ErroNaoEncontrado('Horário não encontrado.')
  res.json(horarioResposta(aula))
})

export default router
