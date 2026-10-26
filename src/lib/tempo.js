// Dia e hora no fuso America/Sao_Paulo (contrato, seção 2.5).
// O servidor da Vercel opera em UTC: sem esta conversão, "ocupada agora" erra em 3 horas
// e, depois das 21:00, até o dia da semana.
const NOMES_DIA = { Mon: 'SEGUNDA', Tue: 'TERCA', Wed: 'QUARTA', Thu: 'QUINTA', Fri: 'SEXTA', Sat: 'SABADO', Sun: 'DOMINGO' }

const formatador = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Sao_Paulo',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23', // evita "24:05" à meia-noite
})

// Retorna { dia: 'SEGUNDA'..'DOMINGO', hora: 'HH:MM' }. O parâmetro permite testar com datas fixas.
export function agoraSaoPaulo(data = new Date()) {
  const partes = Object.fromEntries(formatador.formatToParts(data).map((p) => [p.type, p.value]))
  return { dia: NOMES_DIA[partes.weekday], hora: `${partes.hour}:${partes.minute}` }
}
