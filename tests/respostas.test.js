import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { cursoResposta, horarioResposta } from '../src/lib/respostas.js'

const datas = { criadoEm: new Date(), atualizadoEm: new Date() }

describe('formato das respostas', () => {
  it('curso sai com sigla e sem colunas internas', () => {
    assert.deepEqual(cursoResposta({ id: 1, sigla: 'SI', nome: 'Sistemas', ...datas }), {
      id: 1,
      sigla: 'SI',
      nome: 'Sistemas',
    })
  })

  it('horário sai com horas em HH:MM e sem colunas internas', () => {
    const aula = {
      id: 7,
      salaId: 1,
      cursoId: 2,
      disciplinaId: 3,
      professorId: 4,
      turmaId: 5,
      diaSemana: 'SEGUNDA',
      periodo: 'NOTURNO',
      horaInicio: new Date('1970-01-01T19:00:00Z'),
      horaTermino: new Date('1970-01-01T22:30:00Z'),
      ...datas,
    }
    assert.deepEqual(horarioResposta(aula), {
      id: 7,
      salaId: 1,
      cursoId: 2,
      disciplinaId: 3,
      professorId: 4,
      turmaId: 5,
      diaSemana: 'SEGUNDA',
      periodo: 'NOTURNO',
      horaInicio: '19:00',
      horaTermino: '22:30',
    })
  })
})
