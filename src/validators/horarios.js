import { corpo, diaSemana, hora, id } from '../lib/validacao.js'
import { ErroValidacao } from '../middlewares/erros.js'

// Reutiliza as validações oficiais da equipe; valida também a ordem do intervalo.
export function validarHorario({ diaSemana: dia, horaInicio, horaFim } = {}) {
  const diaNormalizado = diaSemana(dia, 'diaSemana')
  const inicio = hora(horaInicio, 'horaInicio')
  const fim = hora(horaFim, 'horaFim')

  if (inicio >= fim) {
    throw new ErroValidacao('O horário final deve ser maior que o inicial.')
  }

  return { diaSemana: diaNormalizado, horaInicio: inicio, horaFim: fim }
}

export function validarCadastroHorario(body) {
  const dados = corpo(body)
  return {
    turmaId: id(dados.turmaId, 'turmaId'),
    salaId: id(dados.salaId, 'salaId'),
    ...validarHorario(dados),
  }
}
