import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ErroValidacao } from '../src/middlewares/erros.js'
import { validarCadastroHorario, validarHorario } from '../src/validators/horarios.js'

test('aceita horário válido e normaliza dia', () => {
  assert.deepEqual(validarHorario({ diaSemana: 'terça', horaInicio: ' 19:00 ', horaTermino: '22:30' }), {
    diaSemana: 'TERCA', horaInicio: '19:00', horaTermino: '22:30',
  })
})

test('rejeita sábado (RN04: só SEGUNDA a SEXTA)', () => {
  assert.throws(() => validarHorario({ diaSemana: 'SABADO', horaInicio: '08:00', horaTermino: '09:00' }), ErroValidacao)
})

test('rejeita horário invertido', () => {
  assert.throws(() => validarHorario({ diaSemana: 'SEGUNDA', horaInicio: '22:00', horaTermino: '19:00' }), ErroValidacao)
})

test('rejeita horas iguais', () => {
  assert.throws(() => validarHorario({ diaSemana: 'SEGUNDA', horaInicio: '20:00', horaTermino: '20:00' }), ErroValidacao)
})

test('rejeita hora fora do formato HH:MM', () => {
  assert.throws(() => validarHorario({ diaSemana: 'TERCA', horaInicio: '25:00', horaTermino: '27:00' }), ErroValidacao)
})

test('rejeita domingo', () => {
  assert.throws(() => validarHorario({ diaSemana: 'DOMINGO', horaInicio: '19:00', horaTermino: '20:00' }), ErroValidacao)
})

const cadastro = { salaId: 5, cursoId: '1', disciplinaId: 3, professorId: 4, turmaId: '2' }

test('normaliza IDs e horários de cadastro e deduz o período pela hora de início', () => {
  assert.deepEqual(validarCadastroHorario({
    ...cadastro, diaSemana: 'quarta', horaInicio: '19:00', horaTermino: '20:40',
  }), {
    salaId: 5, cursoId: 1, disciplinaId: 3, professorId: 4, turmaId: 2,
    diaSemana: 'QUARTA', horaInicio: '19:00', horaTermino: '20:40', periodo: 'NOTURNO',
  })
})

test('usa o período informado quando vem no corpo', () => {
  const dados = validarCadastroHorario({ ...cadastro, diaSemana: 'SEGUNDA', horaInicio: '17:30', horaTermino: '19:00', periodo: 'noturno' })
  assert.equal(dados.periodo, 'NOTURNO')
})

test('rejeita IDs inválidos ou corpo ausente', () => {
  assert.throws(() => validarCadastroHorario({ ...cadastro, turmaId: 0, diaSemana: 'TERCA', horaInicio: '19:00', horaTermino: '20:00' }), ErroValidacao)
  assert.throws(() => validarCadastroHorario(null), ErroValidacao)
})
