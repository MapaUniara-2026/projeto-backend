// Aponta a API para um banco que não existe e confere o 503.
// Cada arquivo de teste roda num processo separado, então isso não afeta os outros testes.
import assert from 'node:assert/strict'
import { after, before, it } from 'node:test'
import { subirApi } from './servidor.js'

process.env.DATABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:1/projeto'

let api
before(async () => {
  api = await subirApi()
})
after(() => api.fechar())

it('banco fora do ar responde 503 BANCO_INDISPONIVEL', async () => {
  const original = console.error
  console.error = () => {}
  try {
    const [status, corpo] = await api.pedir('/api/cursos')
    assert.equal(status, 503)
    assert.equal(corpo.codigo, 'BANCO_INDISPONIVEL')
  } finally {
    console.error = original
  }
})
