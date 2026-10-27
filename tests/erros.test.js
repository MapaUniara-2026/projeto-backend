import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ErroNaoEncontrado, ErroValidacao, tratarErros } from '../src/middlewares/erros.js'

function responder(err) {
  const res = {
    status(codigo) {
      this.statusCode = codigo
      return this
    },
    json(corpo) {
      this.corpo = corpo
      return this
    },
  }
  const original = console.error
  console.error = () => {} // os erros 500/503 são logados de propósito; aqui só poluiriam a saída
  try {
    tratarErros(err, { method: 'GET', originalUrl: '/teste' }, res)
  } finally {
    console.error = original
  }
  return [res.statusCode, res.corpo]
}

const erroPrisma = (code, meta = {}) => Object.assign(new Error('prisma'), { name: 'PrismaClientKnownRequestError', code, meta })
const semConexao = { driverAdapterError: { cause: { kind: 'DatabaseNotReachable' } } }

describe('tratamento de erros', () => {
  it('erros da própria API', () => {
    assert.deepEqual(responder(new ErroValidacao('ruim')), [400, { erro: 'ruim', codigo: 'PARAMETRO_INVALIDO' }])
    assert.deepEqual(responder(new ErroNaoEncontrado('Curso não encontrado.')), [
      404,
      { erro: 'Curso não encontrado.', codigo: 'NAO_ENCONTRADO' },
    ])
  })

  it('erros do Prisma viram códigos da API, sem expor P2xxx nem campos', () => {
    const [status, corpo] = responder(erroPrisma('P2002', { target: ['codigo'] }))
    assert.equal(status, 409)
    assert.deepEqual(Object.keys(corpo), ['erro', 'codigo'])
    assert.equal(corpo.codigo, 'CONFLITO')
    assert.equal(responder(erroPrisma('P2003'))[1].codigo, 'CONFLITO')
    assert.deepEqual(responder(erroPrisma('P2025'))[0], 404)
  })

  it('banco fora do ar responde 503', () => {
    for (const err of [
      erroPrisma('P1001', semConexao),
      erroPrisma('P1000'),
      erroPrisma('P2010', semConexao), // $queryRaw
      Object.assign(new Error('init'), { name: 'PrismaClientInitializationError' }),
      Object.assign(new Error('connect'), { code: 'ECONNREFUSED' }),
      new Error('Connection terminated unexpectedly'), // conexão do pool caiu no meio da consulta
    ]) {
      assert.deepEqual(responder(err)[0], 503)
      assert.equal(responder(err)[1].codigo, 'BANCO_INDISPONIVEL')
    }
  })

  it('JSON inválido no corpo responde 400', () => {
    const err = Object.assign(new SyntaxError('Unexpected token'), { type: 'entity.parse.failed', status: 400 })
    assert.deepEqual(responder(err), [
      400,
      { erro: 'O corpo da requisição não é um JSON válido.', codigo: 'PARAMETRO_INVALIDO' },
    ])
  })

  it('qualquer outro erro vira 500 sem detalhes internos', () => {
    assert.deepEqual(responder(new TypeError('x is undefined')), [
      500,
      { erro: 'Erro interno do servidor.', codigo: 'ERRO_INTERNO' },
    ])
    assert.equal(responder(erroPrisma('P2010', { driverAdapterError: { cause: { kind: 'Outro' } } }))[0], 500)
  })
})
