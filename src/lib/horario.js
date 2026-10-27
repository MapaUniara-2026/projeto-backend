// Datas e horas da API. As aulas são guardadas como "HH:MM" (horário local do campus),
// então o fuso só importa para descobrir o "agora" da ocupação das salas.
// Usamos Intl com America/Sao_Paulo porque a Vercel roda em UTC e não deixa definir TZ.
const FUSO = 'America/Sao_Paulo'

const DIAS = { Sun: 'DOMINGO', Mon: 'SEGUNDA', Tue: 'TERCA', Wed: 'QUARTA', Thu: 'QUINTA', Fri: 'SEXTA', Sat: 'SABADO' }

const formato = new Intl.DateTimeFormat('en-US', {
  timeZone: FUSO,
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

// Devolve { dia: 'SEGUNDA'...'DOMINGO', hora: 'HH:MM' } no horário de Brasília.
export function agoraNoCampus(data = new Date()) {
  const partes = Object.fromEntries(formato.formatToParts(data).map((p) => [p.type, p.value]))
  return { dia: DIAS[partes.weekday], hora: `${partes.hour}:${partes.minute}` }
}

// Faixas: MATUTINO até 11:59, VESPERTINO de 12:00 a 17:59, NOTURNO a partir de 18:00.
export function periodoDaHora(hhmm) {
  if (hhmm < '12:00') return 'MATUTINO'
  if (hhmm < '18:00') return 'VESPERTINO'
  return 'NOTURNO'
}

// Garante "HH:MM" na resposta, mesmo que o banco devolva "19:00:00" ou um Date (coluna TIME).
export function formatarHora(valor) {
  if (valor === null || valor === undefined) return null
  if (valor instanceof Date) return valor.toISOString().slice(11, 16)
  return String(valor).slice(0, 5)
}
