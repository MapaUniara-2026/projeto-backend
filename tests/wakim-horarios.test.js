import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ErroValidacao } from '../src/middlewares/erros.js'
import { validarCadastroHorario, validarHorario } from '../src/validators/horarios.js'

test('aceita horário válido e normaliza dia', () => {
  assert.deepEqual(validarHorario({ diaSemana: 'terça', horaInicio: ' 19:00 ', horaFim: '22:30' }), {
    diaSemana: 'TERCA', horaInicio: '19:00', horaFim: '22:30',
  })
})

test('aceita sábado, como a validação oficial do Felipe', () => {
  assert.equal(validarHorario({ diaSemana: 'SABADO', horaInicio: '08:00', horaFim: '09:00' }).diaSemana, 'SABADO')
})

test('rejeita horário invertido', () => {
  assert.throws(() => validarHorario({ diaSemana: 'SEGUNDA', horaInicio: '22:00', horaFim: '19:00' }), ErroValidacao)
})

test('rejeita horas iguais', () => {
  assert.throws(() => validarHorario({ diaSemana: 'SEGUNDA', horaInicio: '20:00', horaFim: '20:00' }), ErroValidacao)
})

test('rejeita hora fora do formato HH:MM', () => {
  assert.throws(() => validarHorario({ diaSemana: 'TERCA', horaInicio: '25:00', horaFim: '27:00' }), ErroValidacao)
})

test('rejeita domingo', () => {
  assert.throws(() => validarHorario({ diaSemana: 'DOMINGO', horaInicio: '19:00', horaFim: '20:00' }), ErroValidacao)
})

test('normaliza IDs e horários de cadastro', () => {
  assert.deepEqual(validarCadastroHorario({
    turmaId: '2', salaId: 5, diaSemana: 'quarta', horaInicio: '19:00', horaFim: '20:40',
  }), { turmaId: 2, salaId: 5, diaSemana: 'QUARTA', horaInicio: '19:00', horaFim: '20:40' })
})

test('rejeita IDs inválidos ou corpo ausente', () => {
  assert.throws(() => validarCadastroHorario({ turmaId: 0, salaId: 1, diaSemana: 'TERCA', horaInicio: '19:00', horaFim: '20:00' }), ErroValidacao)
  assert.throws(() => validarCadastroHorario(null), ErroValidacao)
})
