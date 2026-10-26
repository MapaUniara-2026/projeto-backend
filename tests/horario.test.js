import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { agoraNoCampus, formatarHora, periodoDaHora } from '../src/lib/horario.js'

describe('horário do campus', () => {
  it('converte UTC para America/Sao_Paulo', () => {
    // Segunda 2026-10-26 01:30 UTC = domingo 22:30 em Brasília (UTC-3).
    assert.deepEqual(agoraNoCampus(new Date('2026-10-26T01:30:00Z')), { dia: 'DOMINGO', hora: '22:30' })
    assert.deepEqual(agoraNoCampus(new Date('2026-10-26T22:00:00Z')), { dia: 'SEGUNDA', hora: '19:00' })
    assert.deepEqual(agoraNoCampus(new Date('2026-10-27T03:05:00Z')), { dia: 'TERCA', hora: '00:05' })
  })

  it('faixas de período', () => {
    assert.equal(periodoDaHora('07:00'), 'MATUTINO')
    assert.equal(periodoDaHora('11:59'), 'MATUTINO')
    assert.equal(periodoDaHora('12:00'), 'VESPERTINO')
    assert.equal(periodoDaHora('17:59'), 'VESPERTINO')
    assert.equal(periodoDaHora('18:00'), 'NOTURNO')
  })

  it('formata horas como HH:MM', () => {
    assert.equal(formatarHora('19:00'), '19:00')
    assert.equal(formatarHora('19:00:00'), '19:00')
    assert.equal(formatarHora(new Date('1970-01-01T08:15:00Z')), '08:15')
    assert.equal(formatarHora(null), null)
  })
})
