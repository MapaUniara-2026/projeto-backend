import { ErroValidacao } from '../middlewares/erros.js'

const DIAS_VALIDOS = new Set(['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'])
const PERIODOS = {
  MATUTINO: { inicio: '05:00', fim: '12:00' },
  VESPERTINO: { inicio: '12:00', fim: '18:00' },
  NOTURNO: { inicio: '18:00', fim: '24:00' },
}
const CAMPOS = new Set([
  'dia', 'periodo', 'sala', 'bloco', 'curso', 'turma', 'professor', 'semestre', 'inicio', 'fim',
])
const HORA = /^(?:[01]\d|2[0-3]):[0-5]\d$/

export const RELACOES_ACADEMICAS = {
  sala: {
    select: { id: true, codigo: true, bloco: true, capacidade: true },
  },
  turma: {
    select: {
      id: true,
      codigo: true,
      semestre: true,
      curso: { select: { id: true, codigo: true, nome: true } },
      professor: { select: { id: true, nome: true } },
    },
  },
}

function lerTexto(valor, nome) {
  if (valor === undefined || valor === null || valor === '') return undefined
  if (typeof valor !== 'string' || !valor.trim() || valor.trim().length > 100) {
    throw new ErroValidacao(`O filtro "${nome}" deve ser um texto de 1 a 100 caracteres.`)
  }
  return valor.trim()
}

export function normalizarFiltros(query = {}) {
  for (const nome of Object.keys(query)) {
    if (!CAMPOS.has(nome)) throw new ErroValidacao(`Filtro não reconhecido: "${nome}".`)
  }

  const filtros = {}
  for (const nome of CAMPOS) filtros[nome] = lerTexto(query[nome], nome)

  if (filtros.dia) {
    filtros.dia = filtros.dia.toUpperCase()
    if (!DIAS_VALIDOS.has(filtros.dia)) {
      throw new ErroValidacao('Dia inválido. Use SEGUNDA, TERCA, QUARTA, QUINTA, SEXTA ou SABADO.')
    }
  }

  if (filtros.periodo) {
    filtros.periodo = filtros.periodo.toUpperCase()
    if (!Object.hasOwn(PERIODOS, filtros.periodo)) {
      throw new ErroValidacao('Período inválido. Use MATUTINO, VESPERTINO ou NOTURNO.')
    }
  }

  for (const nome of ['inicio', 'fim']) {
    if (filtros[nome] && !HORA.test(filtros[nome])) {
      throw new ErroValidacao(`O filtro "${nome}" deve estar no formato HH:MM.`)
    }
  }

  if (filtros.inicio && filtros.fim && filtros.inicio >= filtros.fim) {
    throw new ErroValidacao('O horário de início deve ser anterior ao horário de fim.')
  }

  return filtros
}

export function montarConsultaAcademica(query = {}) {
  const filtros = normalizarFiltros(query)
  const where = {}
  const and = []

  if (filtros.dia) where.diaSemana = filtros.dia

  const local = {}
  if (filtros.sala) local.codigo = { equals: filtros.sala, mode: 'insensitive' }
  if (filtros.bloco) local.bloco = { equals: filtros.bloco, mode: 'insensitive' }
  if (Object.keys(local).length) where.sala = { is: local }

  const dadosTurma = {}
  if (filtros.turma) dadosTurma.codigo = { equals: filtros.turma, mode: 'insensitive' }
  if (filtros.semestre) dadosTurma.semestre = filtros.semestre
  if (filtros.curso) {
    dadosTurma.curso = {
      is: {
        OR: [
          { codigo: { equals: filtros.curso, mode: 'insensitive' } },
          { nome: { contains: filtros.curso, mode: 'insensitive' } },
        ],
      },
    }
  }
  if (filtros.professor) {
    dadosTurma.professor = { is: { nome: { contains: filtros.professor, mode: 'insensitive' } } }
  }
  if (Object.keys(dadosTurma).length) where.turma = { is: dadosTurma }

  if (filtros.periodo) {
    const { inicio, fim } = PERIODOS[filtros.periodo]
    and.push({ horaInicio: { gte: inicio } })
    and.push({ horaInicio: { lt: fim } })
  }

  if (filtros.inicio) and.push({ horaInicio: { gte: filtros.inicio } })
  if (filtros.fim) and.push({ horaFim: { lte: filtros.fim } })
  if (and.length) where.AND = and

  return {
    where,
    include: RELACOES_ACADEMICAS,
    orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }, { sala: { codigo: 'asc' } }],
  }
}

export function formatarAula(horario) {
  return {
    id: horario.id,
    diaSemana: horario.diaSemana,
    horaInicio: horario.horaInicio,
    horaFim: horario.horaFim,
    sala: horario.sala,
    turma: {
      id: horario.turma.id,
      codigo: horario.turma.codigo,
      semestre: horario.turma.semestre,
    },
    curso: horario.turma.curso,
    professor: horario.turma.professor,
  }
}

export async function consultarAulas(prisma, query = {}) {
  const consulta = montarConsultaAcademica(query)
  const horarios = await prisma.horario.findMany(consulta)
  return horarios.map(formatarAula)
}

export async function consultarAulaPorId(prisma, idInformado) {
  if (!/^[1-9]\d*$/.test(String(idInformado))) {
    throw new ErroValidacao('O ID da aula deve ser um número inteiro positivo.')
  }
  const id = Number(idInformado)
  if (!Number.isSafeInteger(id)) {
    throw new ErroValidacao('O ID da aula deve ser um número inteiro positivo válido.')
  }
  const horario = await prisma.horario.findUniqueOrThrow({
    where: { id },
    include: RELACOES_ACADEMICAS,
  })
  return formatarAula(horario)
}
