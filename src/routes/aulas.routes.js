// Consulta de aulas (tabela "horarios") com filtros combinados — RF04 a RF11.
// Ex.: GET /api/aulas?dia=SEGUNDA&periodo=NOTURNO&curso=SI
import { Router } from 'express'
import { DIAS, PERIODOS, filtroCodigo, filtroId, periodoDe } from '../lib/filtros.js'
import { prisma } from '../lib/prisma.js'
import { ErroValidacao } from '../middlewares/erros.js'

const router = Router()

router.get('/', async (req, res) => {
  const dia = filtroCodigo(req.query, 'dia')
  const periodo = filtroCodigo(req.query, 'periodo')
  const curso = filtroCodigo(req.query, 'curso')
  const sala = filtroCodigo(req.query, 'sala')
  const turma = filtroCodigo(req.query, 'turma')
  const semestre = filtroCodigo(req.query, 'semestre')
  const professor = filtroId(req.query, 'professor')

  if (dia && !DIAS.includes(dia)) {
    throw new ErroValidacao('Dia inválido. Use de SEGUNDA a SEXTA.')
  }
  if (periodo && !PERIODOS[periodo]) {
    throw new ErroValidacao('Período inválido. Use MATUTINO, VESPERTINO ou NOTURNO.')
  }

  const horarios = await prisma.horario.findMany({
    // RF11: os filtros informados são combinados (E). Os ausentes ficam undefined e o Prisma ignora.
    where: {
      diaSemana: dia ?? { in: DIAS }, // RN04: mesmo sem filtro, só segunda a sexta
      horaInicio: PERIODOS[periodo],
      sala: sala ? { codigo: sala } : undefined,
      turma: {
        codigo: turma,
        semestre,
        professorId: professor,
        curso: curso ? { codigo: curso } : undefined,
      },
    },
    // select (e não include) para não expor dados desnecessários, como o e-mail do professor.
    select: {
      id: true,
      diaSemana: true,
      horaInicio: true,
      horaFim: true,
      sala: { select: { codigo: true, bloco: true } },
      turma: {
        select: {
          codigo: true,
          semestre: true,
          curso: { select: { codigo: true, nome: true } },
          professor: { select: { id: true, nome: true } },
        },
      },
    },
    orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
  })

  // Lista vazia = nenhuma aula atende aos filtros (o front mostra o aviso do RF15).
  res.json(
    horarios.map(({ turma, ...h }) => ({
      id: h.id,
      dia: h.diaSemana,
      inicio: h.horaInicio,
      fim: h.horaFim,
      periodo: periodoDe(h.horaInicio),
      sala: h.sala,
      turma: { codigo: turma.codigo, semestre: turma.semestre },
      curso: turma.curso,
      professor: turma.professor,
    })),
  )
})

export default router
