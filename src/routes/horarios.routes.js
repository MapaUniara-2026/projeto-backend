// Registros de horário = linhas da tabela aulas, com os ids das relações (para quem cadastra).
// Para a tela, use /api/aulas (contrato 2.1).
import { Router } from 'express'
import { paraTime } from '../lib/horarios.js'
import { prisma } from '../lib/prisma.js'
import { horarioResposta, selectHorario } from '../lib/respostas.js'
import { diaSemana, id, opcional } from '../lib/validacao.js'
import { ErroApi, ErroNaoEncontrado } from '../middlewares/erros.js'
import { consultarConflitoNoBanco } from '../validators/conflitos-horarios.js'
import { validarCadastroHorario } from '../validators/horarios.js'

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

// Relações que precisam existir antes de gravar; sem isso a foreign key do banco
// recusaria o cadastro com um 409 genérico.
const RELACOES = [
  ['sala', 'salaId', 'Sala não encontrada.'],
  ['curso', 'cursoId', 'Curso não encontrado.'],
  ['disciplina', 'disciplinaId', 'Disciplina não encontrada.'],
  ['professor', 'professorId', 'Professor não encontrado.'],
  ['turma', 'turmaId', 'Turma não encontrada.'],
]

// Cadastro sujeito à tarefa 3.7 (RNF08): rotas de escrita saem ou ganham autenticação.
router.post('/', async (req, res) => {
  const dados = validarCadastroHorario(req.body)

  const encontrados = await Promise.all(
    RELACOES.map(([modelo, campo]) => prisma[modelo].findUnique({ where: { id: dados[campo] }, select: { id: true } })),
  )
  const faltando = RELACOES.find((_, i) => !encontrados[i])
  if (faltando) throw new ErroNaoEncontrado(faltando[2])

  const conflito = await consultarConflitoNoBanco(prisma, dados)
  if (conflito) {
    const tipo = conflito.tipo === 'SALA' ? 'A sala já está ocupada' : 'A turma já possui uma aula'
    throw new ErroApi('CONFLITO', `${tipo} em horário sobreposto neste dia.`)
  }

  const aula = await prisma.aula.create({
    data: { ...dados, horaInicio: paraTime(dados.horaInicio), horaTermino: paraTime(dados.horaTermino) },
    select: selectHorario,
  })
  res.status(201).json(horarioResposta(aula))
})

export default router
