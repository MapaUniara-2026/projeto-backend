// Sobreposição de horários (contrato, seção 3.2 / RNF11).
//
// O @@unique do schema só barra horários com o MESMO início (19:00 e 19:00).
// Ele não barra 19:00–20:40 junto de 20:00–21:40. Esta verificação cobre esse caso,
// tanto para a sala (duas turmas na mesma sala) quanto para a turma (duas salas ao mesmo tempo).
// Chame antes de criar ou editar um Horario.
import { conflito } from '../middlewares/erros.js'
import { validarDia, validarIntervalo } from './validacao.js'

// Intervalos [inicio, fim): 19:00–20:40 e 20:40–22:20 NÃO se sobrepõem.
export function intervalosSeSobrepoem(inicioA, fimA, inicioB, fimB) {
  return inicioA < fimB && inicioB < fimA
}

export async function verificarConflitoHorario(prisma, { salaId, turmaId, diaSemana, horaInicio, horaFim, ignorarId }) {
  validarDia(diaSemana)
  validarIntervalo(horaInicio, horaFim)

  const base = {
    diaSemana,
    horaInicio: { lt: horaFim }, // começa antes de o novo terminar
    horaFim: { gt: horaInicio }, // termina depois de o novo começar
    ...(ignorarId ? { id: { not: ignorarId } } : {}),
  }

  const naSala = await prisma.horario.findFirst({ where: { ...base, salaId } })
  if (naSala) {
    throw conflito('A sala já está ocupada neste dia e em horário que se sobrepõe.', 'CONFLITO_HORARIO_SALA')
  }

  const naTurma = await prisma.horario.findFirst({ where: { ...base, turmaId } })
  if (naTurma) {
    throw conflito('A turma já tem aula neste dia e em horário que se sobrepõe.', 'CONFLITO_HORARIO_TURMA')
  }
}
