// Regras de dia, período e horário compartilhadas pelas rotas (contrato 2.5).
// As colunas de hora são TIME: o Prisma devolve e recebe Date em 1970-01-01, sempre em UTC.
// O fuso só importa para descobrir o "agora" da ocupação (a Vercel roda em UTC).
import { ErroValidacao } from '../middlewares/erros.js'

export const DIAS = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA'] // RN04
export const PERIODOS = ['MATUTINO', 'VESPERTINO', 'NOTURNO'] // RN03
export const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

// Valida um valor contra uma lista (ex.: ?dia=segunda -> 'SEGUNDA'). Inválido -> 400.
export function validarOpcao(valor, opcoes, nomeDoFiltro) {
  const v = String(valor).toUpperCase()
  if (!opcoes.includes(v)) {
    throw new ErroValidacao(`O filtro "${nomeDoFiltro}" aceita: ${opcoes.join(', ')}.`)
  }
  return v
}

// "19:30" -> Date usado nas colunas TIME. Inválido -> 400.
export function paraTime(hhmm, nomeDoFiltro = 'hora') {
  if (!HHMM.test(String(hhmm))) {
    throw new ErroValidacao(`O filtro "${nomeDoFiltro}" deve estar no formato "HH:MM" (ex.: 19:30).`)
  }
  return new Date(`1970-01-01T${hhmm}:00Z`)
}

// Garante "HH:MM" na resposta: aceita o Date da coluna TIME ou um texto "19:00:00".
export function formatarHora(valor) {
  if (valor === null || valor === undefined) return null
  if (valor instanceof Date) return valor.toISOString().slice(11, 16)
  return String(valor).slice(0, 5)
}

// Faixas: MATUTINO até 11:59, VESPERTINO de 12:00 a 17:59, NOTURNO a partir de 18:00.
export function periodoDaHora(hhmm) {
  if (hhmm < '12:00') return 'MATUTINO'
  if (hhmm < '18:00') return 'VESPERTINO'
  return 'NOTURNO'
}

const formatoSaoPaulo = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Sao_Paulo',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})
const DIAS_UTEIS = { Mon: 'SEGUNDA', Tue: 'TERCA', Wed: 'QUARTA', Thu: 'QUINTA', Fri: 'SEXTA' }

// Dia da semana e hora em São Paulo (o servidor na Vercel roda em UTC).
// Sábado e domingo voltam como dia null: não há aulas (RN04).
export function agoraEmSaoPaulo(data = new Date()) {
  const partes = Object.fromEntries(formatoSaoPaulo.formatToParts(data).map((p) => [p.type, p.value]))
  return { dia: DIAS_UTEIS[partes.weekday] ?? null, hora: `${partes.hour}:${partes.minute}` }
}
