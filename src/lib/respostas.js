// Formato das respostas da API, montado campo a campo.
// Regras: só sai o que está aqui (nada de criadoEm/atualizadoEm), campo sem valor sai como null
// (nunca omitido), listas vazias saem como [] e horas saem como "HH:MM".
// Para cada mapper existe um "select" com exatamente as colunas que ele usa.
// Salas e aulas do contrato são montadas nas próprias rotas/serviço (CAMPOS_SALA e SELECT_AULA).
import { formatarHora } from './horarios.js'

export const selectCurso = { id: true, sigla: true, nome: true }

export const cursoResposta = (curso) => ({
  id: curso.id,
  sigla: curso.sigla,
  nome: curso.nome,
})

// Registro de horário (/api/horarios): a aula com os ids das relações, para quem cadastra.
export const selectHorario = {
  id: true,
  salaId: true,
  cursoId: true,
  disciplinaId: true,
  professorId: true,
  turmaId: true,
  diaSemana: true,
  periodo: true,
  horaInicio: true,
  horaTermino: true,
}

export const horarioResposta = (aula) => ({
  id: aula.id,
  salaId: aula.salaId,
  cursoId: aula.cursoId,
  disciplinaId: aula.disciplinaId,
  professorId: aula.professorId,
  turmaId: aula.turmaId,
  diaSemana: aula.diaSemana,
  periodo: aula.periodo,
  horaInicio: formatarHora(aula.horaInicio),
  horaTermino: formatarHora(aula.horaTermino),
})
