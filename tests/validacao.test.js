import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import * as v from '../src/lib/validacao.js'
import { ErroValidacao } from '../src/middlewares/erros.js'

const invalido = (fn) => assert.throws(fn, ErroValidacao)

describe('validação de entrada', () => {
  it('dia: normaliza maiúsculas e acentos', () => {
    assert.equal(v.diaSemana('segunda'), 'SEGUNDA')
    assert.equal(v.diaSemana(' Terça '), 'TERCA')
    assert.equal(v.diaSemana('sábado'), 'SABADO')
    invalido(() => v.diaSemana('DOMINGO'))
    invalido(() => v.diaSemana('seg'))
    invalido(() => v.diaSemana(undefined))
    invalido(() => v.diaSemana(['SEGUNDA', 'TERCA']))
  })

  it('período: só MATUTINO, VESPERTINO e NOTURNO', () => {
    assert.equal(v.periodo('noturno'), 'NOTURNO')
    invalido(() => v.periodo('noite'))
  })

  it('hora: formato HH:MM de 00:00 a 23:59', () => {
    assert.equal(v.hora('07:30'), '07:30')
    assert.equal(v.hora(' 23:59 '), '23:59')
    for (const h of ['7:30', '24:00', '12:60', '12h30', '12:30:00', '']) invalido(() => v.hora(h))
  })

  it('código de sala: formato do mapa', () => {
    assert.equal(v.codigoSala('bl4-104'), 'BL4-104')
    assert.equal(v.codigoSala('B-101'), 'B-101')
    for (const c of ['104', 'BL4 104', 'BL4-', '-104', 'BL4-104; DROP']) invalido(() => v.codigoSala(c))
  })

  it('sigla de curso', () => {
    assert.equal(v.siglaCurso(' si '), 'SI')
    invalido(() => v.siglaCurso('S'))
    invalido(() => v.siglaCurso('Sistemas de Informação'))
  })

  it('andar: inteiro, 0 = térreo', () => {
    assert.equal(v.andar('0'), 0)
    assert.equal(v.andar(2), 2)
    for (const a of ['-1', '1.5', 'térreo', '1e2', '']) invalido(() => v.andar(a))
  })

  it('id: inteiro positivo dentro do Int do PostgreSQL', () => {
    assert.equal(v.id('42'), 42)
    for (const i of ['0', 'abc', '1abc', '2147483648']) invalido(() => v.id(i))
  })

  it('busca: limite de tamanho', () => {
    assert.equal(v.busca('  lab  '), 'lab')
    invalido(() => v.busca('x'.repeat(v.TAMANHO_MAXIMO_BUSCA + 1)))
  })

  it('opcional: ausente vira null, presente é validado', () => {
    const diaOpcional = v.opcional(v.diaSemana)
    assert.equal(diaOpcional(undefined), null)
    assert.equal(diaOpcional('  '), null)
    assert.equal(diaOpcional('quarta'), 'QUARTA')
    invalido(() => diaOpcional('domingo'))
  })

  it('corpo: exige um objeto JSON', () => {
    assert.deepEqual(v.corpo({ a: 1 }), { a: 1 })
    for (const b of [undefined, null, [], 'texto']) invalido(() => v.corpo(b))
  })
})
