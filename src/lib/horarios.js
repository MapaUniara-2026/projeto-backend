// Regras de dia, período e horário compartilhadas pelas rotas (contrato 2.5).
import { ErroValidacao } from '../middlewares/erros.js'

export const DIAS = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA'] // RN04
export const PERIODOS = ['MATUTINO', 'VESPERTINO', 'NOTURNO'] // RN03
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

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

// Date vindo de uma coluna TIME -> "19:30".
export function formatarHora(data) {
  return data.toISOString().slice(11, 16)
}

// Dia da semana e hora atuais em São Paulo (o servidor na Vercel roda em UTC).
// Sábado e domingo voltam como dia null: não há aulas (RN04).
export function agoraEmSaoPaulo() {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const pegar = (tipo) => partes.find((p) => p.type === tipo).value
  const dias = { Mon: 'SEGUNDA', Tue: 'TERCA', Wed: 'QUARTA', Thu: 'QUINTA', Fri: 'SEXTA' }
  return { dia: dias[pegar('weekday')] ?? null, hora: `${pegar('hour')}:${pegar('minute')}` }
}
