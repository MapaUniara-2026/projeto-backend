// Sobreposição de horários na tabela aulas (mesma sala ou mesma turma, mesmo dia).
// O banco já impede duas aulas começando no mesmo instante (@@unique); aqui pegamos a
// sobreposição parcial (19:00–22:30 x 20:00–21:00). Horas chegam como "HH:MM".
import { formatarHora, paraTime } from '../lib/horarios.js'

export function horariosSobrepostos(inicioA, fimA, inicioB, fimB) {
  return inicioA < fimB && inicioB < fimA
}

export function detectarConflito(novaAula, aulasExistentes, ignorarAulaId = null) {
  for (const existente of aulasExistentes) {
    if (ignorarAulaId !== null && existente.id === ignorarAulaId) continue
    if (existente.diaSemana !== novaAula.diaSemana) continue

    const sobrepoe = horariosSobrepostos(
      novaAula.horaInicio,
      novaAula.horaTermino,
      formatarHora(existente.horaInicio),
      formatarHora(existente.horaTermino),
    )
    if (!sobrepoe) continue

    if (existente.salaId === novaAula.salaId) return { tipo: 'SALA', horario: existente }
    if (existente.turmaId === novaAula.turmaId) return { tipo: 'TURMA', horario: existente }
  }

  return null
}

export function criarFiltroConflitos(novaAula, ignorarAulaId = null) {
  const filtro = {
    diaSemana: novaAula.diaSemana,
    horaInicio: { lt: paraTime(novaAula.horaTermino, 'horaTermino') },
    horaTermino: { gt: paraTime(novaAula.horaInicio, 'horaInicio') },
    OR: [{ salaId: novaAula.salaId }, { turmaId: novaAula.turmaId }],
  }

  if (ignorarAulaId !== null) filtro.id = { not: ignorarAulaId }

  return filtro
}

export async function consultarConflitoNoBanco(prisma, novaAula, ignorarAulaId = null) {
  const existente = await prisma.aula.findFirst({
    where: criarFiltroConflitos(novaAula, ignorarAulaId),
  })

  if (!existente) return null

  return {
    tipo: existente.salaId === novaAula.salaId ? 'SALA' : 'TURMA',
    horario: existente,
  }
}
