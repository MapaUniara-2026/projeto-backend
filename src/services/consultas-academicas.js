// Consulta de aulas com filtros combináveis (contrato 2.1, 2.3 e 2.5), usada por /api/aulas e /api/salas/ocupacao.
// Filtros do contrato: curso (sigla), dia, periodo e sala (código).
// Filtros extras: bloco, turma (nome), professor (parte do nome), semestre, inicio e fim ("HH:MM").
import { formatarHora, paraTime } from '../lib/horarios.js'
import { diaSemana, hora, id, inteiro, periodo } from '../lib/validacao.js'
import { ErroNaoEncontrado, ErroValidacao } from '../middlewares/erros.js'

const CAMPOS = new Set([
  'dia', 'periodo', 'sala', 'bloco', 'curso', 'turma', 'professor', 'semestre', 'inicio', 'fim',
])

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

  if (filtros.dia) filtros.dia = diaSemana(filtros.dia)
  if (filtros.periodo) filtros.periodo = periodo(filtros.periodo)
  if (filtros.semestre) filtros.semestre = inteiro(filtros.semestre, 'semestre', { min: 1, max: 20 })
  if (filtros.inicio) filtros.inicio = hora(filtros.inicio, 'inicio')
  if (filtros.fim) filtros.fim = hora(filtros.fim, 'fim')

  if (filtros.inicio && filtros.fim && filtros.inicio >= filtros.fim) {
    throw new ErroValidacao('O horário de início deve ser anterior ao horário de fim.')
  }

  return filtros
}

const igual = (valor) => ({ equals: valor, mode: 'insensitive' })

export function montarConsultaAcademica(query = {}) {
  const filtros = normalizarFiltros(query)
  const where = {}
  const and = []

  if (filtros.dia) where.diaSemana = filtros.dia
  if (filtros.periodo) where.periodo = filtros.periodo
  if (filtros.curso) where.curso = { is: { sigla: igual(filtros.curso) } }
  if (filtros.professor) where.professor = { is: { nome: { contains: filtros.professor, mode: 'insensitive' } } }

  const local = {}
  if (filtros.sala) local.codigo = igual(filtros.sala)
  if (filtros.bloco) local.bloco = igual(filtros.bloco)
  if (Object.keys(local).length) where.sala = { is: local }

  const turma = {}
  if (filtros.turma) turma.nome = igual(filtros.turma)
  if (filtros.semestre) turma.semestre = filtros.semestre
  if (Object.keys(turma).length) where.turma = { is: turma }

  if (filtros.inicio) and.push({ horaInicio: { gte: paraTime(filtros.inicio, 'inicio') } })
  if (filtros.fim) and.push({ horaTermino: { lte: paraTime(filtros.fim, 'fim') } })
  if (and.length) where.AND = and

  return {
    where,
    select: SELECT_AULA,
    // O enum segue a ordem em que foi declarado: SEGUNDA, TERCA, ... SEXTA.
    orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }, { sala: { codigo: 'asc' } }],
  }
}

// Busca sem resultado devolve [] (não é 404).
export async function consultarAulas(prisma, query = {}) {
  const aulas = await prisma.aula.findMany(montarConsultaAcademica(query))
  return aulas.map(formatarAula)
}

export async function consultarAulaPorId(prisma, idInformado) {
  const aula = await prisma.aula.findUnique({
    where: { id: id(idInformado) },
    select: SELECT_AULA,
  })
  if (!aula) throw new ErroNaoEncontrado('Aula não encontrada.')
  return formatarAula(aula)
}
