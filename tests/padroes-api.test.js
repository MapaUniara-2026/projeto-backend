// Testes dos padrões transversais do contrato (seções 2.5, 2.6 e 3.2).
// Não precisam de banco: usam o tratador de erros real com rotas de mentira.
import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import express from 'express'
import { conflito, ErroValidacao, naoEncontrado, rotaNaoEncontrada, tratarErros } from '../src/middlewares/erros.js'
import { intervalosSeSobrepoem, verificarConflitoHorario } from '../src/lib/horarios.js'
import { agoraSaoPaulo } from '../src/lib/tempo.js'
import {
  corpoPadrao, parseId, periodoPorHorario, validarDia, validarHorario, validarPeriodo,
} from '../src/lib/validacao.js'

// ---------- formato de erro (2.6) ----------
function erroComCodigo(props) {
  return Object.assign(new Error('falha do banco com detalhes internos: senha=segredo'), props)
}

const ROTAS_DE_ERRO = {
  '/validacao': () => parseId('abc'),
  '/nan': () => parseId(Number('abc')),
  '/dia': () => validarDia('SABADO'),
  '/corpo': (req) => { if (!req.body.codigo) throw new ErroValidacao('codigo é obrigatório.') },
  '/404': () => { throw naoEncontrado('Sala não encontrada.') },
  '/409': () => { throw conflito('Conflito.', 'CONFLITO_HORARIO_SALA') },
  '/p2002': () => { throw erroComCodigo({ code: 'P2002', meta: { target: ['codigo'] } }) },
  '/p2003': () => { throw erroComCodigo({ code: 'P2003' }) },
  '/p2025': () => { throw erroComCodigo({ code: 'P2025' }) },
  '/prisma-validacao': () => { throw erroComCodigo({ name: 'PrismaClientValidationError' }) },
  '/p1001': () => { throw erroComCodigo({ code: 'P1001' }) },
  '/init': () => { throw erroComCodigo({ name: 'PrismaClientInitializationError' }) },
  '/driver': () => { throw erroComCodigo({ cause: { code: 'ECONNREFUSED' } }) },
  '/inesperado': () => { throw new Error('bug interno: senha=segredo') },
}

describe('formato de erro { erro, codigo }', () => {
  let servidor
  let base

  before(async () => {
    const app = express()
    app.use(express.json())
    app.use(corpoPadrao)
    for (const [rota, fn] of Object.entries(ROTAS_DE_ERRO)) {
      app.get(rota, (req) => { fn(req) })
      app.post(rota, (req) => { fn(req) })
    }
    app.use(rotaNaoEncontrada)
    app.use(tratarErros)
    await new Promise((ok) => { servidor = app.listen(0, ok) })
    base = `http://127.0.0.1:${servidor.address().port}`
  })

  after(() => servidor.close())

  const casos = [
    ['/validacao', 400, 'PARAMETRO_INVALIDO'],
    ['/nan', 400, 'PARAMETRO_INVALIDO'],
    ['/dia', 400, 'PARAMETRO_INVALIDO'],
    ['/404', 404, 'NAO_ENCONTRADO'],
    ['/409', 409, 'CONFLITO_HORARIO_SALA'],
    ['/p2002', 409, 'CONFLITO'],
    ['/p2003', 409, 'CONFLITO'],
    ['/p2025', 404, 'NAO_ENCONTRADO'],
    ['/prisma-validacao', 400, 'PARAMETRO_INVALIDO'],
    ['/p1001', 503, 'BANCO_INDISPONIVEL'],
    ['/init', 503, 'BANCO_INDISPONIVEL'],
    ['/driver', 503, 'BANCO_INDISPONIVEL'],
    ['/inesperado', 500, 'ERRO_INTERNO'],
    ['/rota-que-nao-existe', 404, 'NAO_ENCONTRADO'],
  ]

  for (const [rota, status, codigo] of casos) {
    it(`${rota} -> ${status} ${codigo}`, async () => {
      const r = await fetch(base + rota)
      const corpo = await r.json()
      assert.equal(r.status, status)
      assert.equal(corpo.codigo, codigo)
      assert.equal(typeof corpo.erro, 'string')
      assert.ok(!JSON.stringify(corpo).includes('segredo'), 'não pode vazar detalhe interno')
    })
  }

  it('POST sem corpo JSON -> 400', async () => {
    const r = await fetch(base + '/corpo', { method: 'POST' })
    assert.equal(r.status, 400)
    assert.equal((await r.json()).codigo, 'PARAMETRO_INVALIDO')
  })

  it('JSON malformado -> 400', async () => {
    const r = await fetch(base + '/corpo', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"codigo": ',
    })
    assert.equal(r.status, 400)
    assert.equal((await r.json()).codigo, 'PARAMETRO_INVALIDO')
  })
})

// ---------- valores (2.5) ----------
describe('padrão de valores', () => {
  it('dia: aceita segunda a sexta e recusa SABADO, DOMINGO e minúsculas', () => {
    for (const d of ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA']) assert.equal(validarDia(d), d)
    for (const d of ['SABADO', 'DOMINGO', 'segunda', '', undefined]) assert.throws(() => validarDia(d), { status: 400 })
  })

  it('período: só os três valores do requisito', () => {
    for (const p of ['MATUTINO', 'VESPERTINO', 'NOTURNO']) assert.equal(validarPeriodo(p), p)
    assert.throws(() => validarPeriodo('MADRUGADA'), { status: 400 })
  })

  it('horário "HH:MM"', () => {
    for (const h of ['00:00', '07:30', '19:00', '23:59']) assert.equal(validarHorario(h), h)
    for (const h of ['24:00', '19:60', '9:00', '19:0', '1900', '19:00:00', '', null, 1900]) {
      assert.throws(() => validarHorario(h), { status: 400 }, `deveria recusar ${h}`)
    }
  })

  it('período por horário (cortes 12:00 e 18:00)', () => {
    assert.equal(periodoPorHorario('07:30'), 'MATUTINO')
    assert.equal(periodoPorHorario('11:59'), 'MATUTINO')
    assert.equal(periodoPorHorario('12:00'), 'VESPERTINO')
    assert.equal(periodoPorHorario('17:59'), 'VESPERTINO')
    assert.equal(periodoPorHorario('18:00'), 'NOTURNO')
    assert.equal(periodoPorHorario('19:00'), 'NOTURNO')
  })

  it('id: recusa NaN, texto, negativo, zero, decimal', () => {
    assert.equal(parseId('12'), 12)
    for (const v of ['abc', NaN, '-1', '0', '1.5', '', undefined, '12abc']) {
      assert.throws(() => parseId(v), { status: 400 }, `deveria recusar ${v}`)
    }
  })

  it('fuso: servidor em UTC, resposta em horário de São Paulo', () => {
    // segunda 22:30 UTC = segunda 19:30 em São Paulo
    assert.deepEqual(agoraSaoPaulo(new Date('2026-10-26T22:30:00Z')), { dia: 'SEGUNDA', hora: '19:30' })
    // terça 02:00 UTC ainda é segunda 23:00 em São Paulo (muda até o dia!)
    assert.deepEqual(agoraSaoPaulo(new Date('2026-10-27T02:00:00Z')), { dia: 'SEGUNDA', hora: '23:00' })
    // terça 03:05 UTC = terça 00:05 em São Paulo (sem "24:05")
    assert.deepEqual(agoraSaoPaulo(new Date('2026-10-27T03:05:00Z')), { dia: 'TERCA', hora: '00:05' })
    // sábado
    assert.equal(agoraSaoPaulo(new Date('2026-10-24T15:00:00Z')).dia, 'SABADO')
  })
})

// ---------- sobreposição (3.2) ----------
describe('sobreposição de horários', () => {
  it('intervalos', () => {
    assert.equal(intervalosSeSobrepoem('19:00', '20:40', '20:00', '21:40'), true) // parcial
    assert.equal(intervalosSeSobrepoem('19:00', '22:30', '20:00', '21:00'), true) // contido
    assert.equal(intervalosSeSobrepoem('19:00', '20:40', '19:00', '20:40'), true) // idêntico
    assert.equal(intervalosSeSobrepoem('19:00', '20:40', '20:40', '22:20'), false) // um termina quando o outro começa
    assert.equal(intervalosSeSobrepoem('07:30', '09:10', '19:00', '20:40'), false)
  })

  const novo = { salaId: 1, turmaId: 2, diaSemana: 'SEGUNDA', horaInicio: '20:00', horaFim: '21:40' }

  it('lança 409 quando a sala está ocupada', async () => {
    const prisma = { horario: { findFirst: async ({ where }) => (where.salaId ? { id: 9 } : null) } }
    await assert.rejects(verificarConflitoHorario(prisma, novo), { status: 409, codigo: 'CONFLITO_HORARIO_SALA' })
  })

  it('lança 409 quando a turma já tem aula', async () => {
    const prisma = { horario: { findFirst: async ({ where }) => (where.turmaId ? { id: 9 } : null) } }
    await assert.rejects(verificarConflitoHorario(prisma, novo), { status: 409, codigo: 'CONFLITO_HORARIO_TURMA' })
  })

  it('passa quando não há conflito e monta a consulta de sobreposição', async () => {
    const consultas = []
    const prisma = { horario: { findFirst: async (q) => { consultas.push(q.where); return null } } }
    await verificarConflitoHorario(prisma, { ...novo, ignorarId: 5 })
    assert.equal(consultas.length, 2)
    assert.deepEqual(consultas[0].horaInicio, { lt: '21:40' })
    assert.deepEqual(consultas[0].horaFim, { gt: '20:00' })
    assert.deepEqual(consultas[0].id, { not: 5 })
  })

  it('valida os dados antes de consultar o banco', async () => {
    const prisma = { horario: { findFirst: async () => { throw new Error('não deveria consultar') } } }
    await assert.rejects(verificarConflitoHorario(prisma, { ...novo, diaSemana: 'SABADO' }), { status: 400 })
    await assert.rejects(verificarConflitoHorario(prisma, { ...novo, horaInicio: '22:00', horaFim: '21:00' }), { status: 400 })
  })
})
