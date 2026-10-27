export function horariosSobrepostos(inicioA, fimA, inicioB, fimB) {
  return inicioA < fimB && inicioB < fimA
}

export function detectarConflito(novoHorario, horariosExistentes, ignorarHorarioId = null) {
  for (const existente of horariosExistentes) {
    if (ignorarHorarioId !== null && existente.id === ignorarHorarioId) {
      continue
    }

    if (existente.diaSemana !== novoHorario.diaSemana) {
      continue
    }

    if (!horariosSobrepostos(
      novoHorario.horaInicio,
      novoHorario.horaFim,
      existente.horaInicio,
      existente.horaFim
    )) {
      continue
    }

    if (existente.salaId === novoHorario.salaId) {
      return { tipo: 'SALA', horario: existente }
    }

    if (existente.turmaId === novoHorario.turmaId) {
      return { tipo: 'TURMA', horario: existente }
    }
  }

  return null
}

export function criarFiltroConflitos(novoHorario, ignorarHorarioId = null) {
  const filtro = {
    diaSemana: novoHorario.diaSemana,
    horaInicio: { lt: novoHorario.horaFim },
    horaFim: { gt: novoHorario.horaInicio },
    OR: [
      { salaId: novoHorario.salaId },
      { turmaId: novoHorario.turmaId }
    ]
  }

  if (ignorarHorarioId !== null) {
    filtro.id = { not: ignorarHorarioId }
  }

  return filtro
}

export async function consultarConflitoNoBanco(prisma, novoHorario, ignorarHorarioId = null) {
  const existente = await prisma.horario.findFirst({
    where: criarFiltroConflitos(novoHorario, ignorarHorarioId)
  })

  if (!existente) {
    return null
  }

  return {
    tipo: existente.salaId === novoHorario.salaId ? 'SALA' : 'TURMA',
    horario: existente
  }
}
