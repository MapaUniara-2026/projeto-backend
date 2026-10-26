// Validações e valores padrão do contrato da API (seção 2.5).
// Todas lançam ErroValidacao (400 + codigo PARAMETRO_INVALIDO) quando o valor é inválido.
import { ErroValidacao } from '../middlewares/erros.js'

// RN04: segunda a sexta. SABADO não é aceito pela API.
export const DIAS = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA']

// RN03
export const PERIODOS = ['MATUTINO', 'VESPERTINO', 'NOTURNO']

const REGEX_HORARIO = /^([01]\d|2[0-3]):[0-5]\d$/

export function validarDia(valor) {
  if (!DIAS.includes(valor)) {
    throw new ErroValidacao(`"dia" inválido. Use um destes valores: ${DIAS.join(', ')}.`)
  }
  return valor
}

export function validarPeriodo(valor) {
  if (!PERIODOS.includes(valor)) {
    throw new ErroValidacao(`"periodo" inválido. Use um destes valores: ${PERIODOS.join(', ')}.`)
  }
  return valor
}

// "HH:MM" em 24h, com zero à esquerda (assim a comparação entre textos funciona).
export function validarHorario(valor, nome = 'horario') {
  if (typeof valor !== 'string' || !REGEX_HORARIO.test(valor)) {
    throw new ErroValidacao(`"${nome}" inválido. Use o formato "HH:MM" (ex.: "19:00").`)
  }
  return valor
}

export function validarIntervalo(horaInicio, horaFim) {
  validarHorario(horaInicio, 'horaInicio')
  validarHorario(horaFim, 'horaFim')
  if (horaInicio >= horaFim) {
    throw new ErroValidacao('"horaInicio" deve ser menor que "horaFim".')
  }
}

// Identificador numérico (ex.: :id). Number('abc') vira NaN e, sem isto, o Prisma devolvia 500.
export function parseId(valor, nome = 'id') {
  const texto = String(valor ?? '').trim()
  const n = Number(texto)
  if (!/^\d+$/.test(texto) || !Number.isSafeInteger(n) || n <= 0) {
    throw new ErroValidacao(`"${nome}" deve ser um número inteiro positivo.`)
  }
  return n
}

// Express 5 deixa req.body como undefined quando a requisição não traz JSON.
// Com um objeto vazio, a validação da rota responde 400 (campo obrigatório) em vez de estourar 500.
export function corpoPadrao(req, res, next) {
  req.body ??= {}
  next()
}

// RN03: classificação única do período a partir do horário de início.
// ATENÇÃO: os cortes 12:00 e 18:00 não estão nos requisitos. Confirmar com a Arquitetura/Análise de negócio.
export const INICIO_VESPERTINO = '12:00'
export const INICIO_NOTURNO = '18:00'

export function periodoPorHorario(horaInicio) {
  validarHorario(horaInicio, 'horaInicio')
  if (horaInicio < INICIO_VESPERTINO) return 'MATUTINO'
  if (horaInicio < INICIO_NOTURNO) return 'VESPERTINO'
  return 'NOTURNO'
}
