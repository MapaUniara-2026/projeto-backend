import { periodoDaHora } from '../lib/horarios.js'
import { corpo, diaSemana, hora, id, opcional, periodo } from '../lib/validacao.js'
import { ErroValidacao } from '../middlewares/erros.js'

// Reutiliza as validações oficiais da equipe; valida também a ordem do intervalo.
export function validarHorario({ diaSemana: dia, horaInicio, horaTermino } = {}) {
  const diaNormalizado = diaSemana(dia, 'diaSemana')
  const inicio = hora(horaInicio, 'horaInicio')
  const termino = hora(horaTermino, 'horaTermino')

  if (inicio >= termino) {
    throw new ErroValidacao('O horário de término deve ser maior que o de início.')
  }

  return { diaSemana: diaNormalizado, horaInicio: inicio, horaTermino: termino }
}

// Corpo do cadastro de uma aula (tabela aulas). Horas continuam "HH:MM" aqui;
// a rota converte para TIME (paraTime) só na hora de gravar.
export function validarCadastroHorario(body) {
  const dados = corpo(body)
  const horario = validarHorario(dados)
  return {
    salaId: id(dados.salaId, 'salaId'),
    cursoId: id(dados.cursoId, 'cursoId'),
    disciplinaId: id(dados.disciplinaId, 'disciplinaId'),
    professorId: id(dados.professorId, 'professorId'),
    turmaId: id(dados.turmaId, 'turmaId'),
    ...horario,
    // Sem período informado, vale a faixa da hora de início (RN03).
    periodo: opcional(periodo)(dados.periodo, 'periodo') ?? periodoDaHora(horario.horaInicio),
  }
}
