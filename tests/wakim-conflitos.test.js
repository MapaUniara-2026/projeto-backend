import test from 'node:test'
import assert from 'node:assert/strict'
import {
  horariosSobrepostos,
  detectarConflito,
  criarFiltroConflitos,
  consultarConflitoNoBanco
} from '../src/validators/conflitos-horarios.js'

const base = {
  id: 10,
  salaId: 1,
  turmaId: 20,
  diaSemana: 'SEGUNDA',
  horaInicio: '19:00',
  horaFim: '20:40'
}

test('identifica interseção parcial de horários', () => {
  assert.equal(horariosSobrepostos('19:00', '20:40', '19:30', '21:00'), true)
})

test('identifica aula inteiramente contida em outra', () => {
  assert.equal(horariosSobrepostos('19:00', '22:00', '20:00', '21:00'), true)
})

test('não considera conflito quando uma aula começa na hora que a outra termina', () => {
  assert.equal(horariosSobrepostos('19:00', '20:40', '20:40', '22:00'), false)
})

test('não considera conflito quando os intervalos estão separados', () => {
  assert.equal(horariosSobrepostos('19:00', '20:00', '21:00', '22:00'), false)
})

test('detecta conflito de sala em horários sobrepostos', () => {
  const candidato = { ...base, salaId: 1, turmaId: 21, horaInicio: '19:30', horaFim: '21:00' }
  const conflito = detectarConflito(candidato, [base])
  assert.equal(conflito?.tipo, 'SALA')
  assert.equal(conflito?.horario.id, 10)
})

test('detecta conflito de turma em salas diferentes', () => {
  const candidato = { ...base, salaId: 2, turmaId: 20, horaInicio: '19:30', horaFim: '21:00' }
  assert.equal(detectarConflito(candidato, [base])?.tipo, 'TURMA')
})

test('não detecta conflito no mesmo horário se o dia for diferente', () => {
  const candidato = { ...base, diaSemana: 'TERCA', turmaId: 21 }
  assert.equal(detectarConflito(candidato, [base]), null)
})

test('não detecta conflito quando sala e turma são diferentes', () => {
  const candidato = { ...base, salaId: 2, turmaId: 21 }
  assert.equal(detectarConflito(candidato, [base]), null)
})

test('não detecta conflito em aulas consecutivas na mesma sala', () => {
  const candidato = { ...base, turmaId: 21, horaInicio: '20:40', horaFim: '22:00' }
  assert.equal(detectarConflito(candidato, [base]), null)
})

test('ignora o próprio registro durante atualização', () => {
  assert.equal(detectarConflito(base, [base], 10), null)
})

test('não ignora outros registros ao atualizar', () => {
  const outro = { ...base, id: 11, turmaId: 22, horaInicio: '19:30', horaFim: '21:00' }
  assert.equal(detectarConflito(base, [base, outro], 10)?.horario.id, 11)
})

test('gera filtro Prisma com sobreposição para sala ou turma', () => {
  assert.deepEqual(criarFiltroConflitos(base), {
    diaSemana: 'SEGUNDA',
    horaInicio: { lt: '20:40' },
    horaFim: { gt: '19:00' },
    OR: [{ salaId: 1 }, { turmaId: 20 }]
  })
})

test('exclui um ID do filtro Prisma em operações de atualização', () => {
  assert.deepEqual(criarFiltroConflitos(base, 10).id, { not: 10 })
})

test('consulta o Prisma e classifica um conflito de sala', async () => {
  let consulta
  const prisma = {
    horario: {
      findFirst: async (argumentos) => {
        consulta = argumentos
        return { ...base, turmaId: 99 }
      }
    }
  }

  const conflito = await consultarConflitoNoBanco(prisma, base)
  assert.equal(conflito.tipo, 'SALA')
  assert.deepEqual(consulta.where, criarFiltroConflitos(base))
})

test('consulta o Prisma e classifica um conflito de turma', async () => {
  const prisma = { horario: { findFirst: async () => ({ ...base, salaId: 99 }) } }
  assert.equal((await consultarConflitoNoBanco(prisma, base))?.tipo, 'TURMA')
})

test('retorna null quando o banco não encontra conflitos', async () => {
  const prisma = { horario: { findFirst: async () => null } }
  assert.equal(await consultarConflitoNoBanco(prisma, base), null)
})
