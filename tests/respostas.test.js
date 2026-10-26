import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { cursoDetalheResposta, cursoResposta, salaResposta } from '../src/lib/respostas.js'

const datas = { criadoEm: new Date(), atualizadoEm: new Date() }

describe('formato das respostas', () => {
  it('curso não vaza colunas internas', () => {
    assert.deepEqual(cursoResposta({ id: 1, codigo: 'SI', nome: 'Sistemas', ...datas }), {
      id: 1,
      codigo: 'SI',
      nome: 'Sistemas',
    })
  })

  it('curso detalhado sempre traz turmas (lista vazia quando não há)', () => {
    assert.deepEqual(cursoDetalheResposta({ id: 1, codigo: 'SI', nome: 'Sistemas' }).turmas, [])
  })

  it('sala: campos ausentes saem como null e fotos como []', () => {
    assert.deepEqual(salaResposta({ id: 1, codigo: 'BL4-104', capacidade: 40, ...datas }), {
      id: 1,
      codigo: 'BL4-104',
      nome: null,
      bloco: null,
      andar: null,
      tipo: null,
      capacidade: 40,
      fotos: [],
    })
  })

  it('sala: fotos no padrão { url, descricao }', () => {
    const sala = salaResposta({ id: 1, codigo: 'BL4-104', fotos: [{ id: 9, url: '/fotos/a.jpg' }] })
    assert.deepEqual(sala.fotos, [{ url: '/fotos/a.jpg', descricao: null }])
  })

  it('sala: imagens indisponíveis (sem URL) não chegam ao front', () => {
    const fotos = [{ url: null }, { url: '  ' }, null, { url: '/fotos/b.jpg', descricao: 'Entrada' }]
    assert.deepEqual(salaResposta({ id: 1, codigo: 'BL4-104', fotos }).fotos, [
      { url: '/fotos/b.jpg', descricao: 'Entrada' },
    ])
  })
})
