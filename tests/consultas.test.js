// Testes das consultas e dos filtros (RNF07).
// Criam os próprios dados (códigos TST...) e apagam no final, então não dependem do seed.
import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'
import app from '../src/app.js'
import { periodoDe } from '../src/lib/filtros.js'
import { prisma } from '../src/lib/prisma.js'

const CURSOS = ['TSTA', 'TSTB']
const SALAS = ['TST-101', 'TST-102']
const EMAIL = 'teste.consultas@exemplo.edu.br'

let servidor
let base

// Apaga o que sobrou de uma execução anterior (e limpa no final).
async function limpar() {
  await prisma.horario.deleteMany({ where: { sala: { codigo: { in: SALAS } } } })
  await prisma.turma.deleteMany({ where: { curso: { codigo: { in: CURSOS } } } })
  await prisma.sala.deleteMany({ where: { codigo: { in: SALAS } } })
  await prisma.professor.deleteMany({ where: { email: EMAIL } })
  await prisma.curso.deleteMany({ where: { codigo: { in: CURSOS } } })
}

before(async () => {
  await limpar()
  const [a, b] = await Promise.all(CURSOS.map((codigo) => prisma.curso.create({ data: { codigo, nome: `Curso ${codigo}` } })))
  const [s1, s2] = await Promise.all(SALAS.map((codigo) => prisma.sala.create({ data: { codigo, bloco: 'TST', capacidade: 30 } })))
  const prof = await prisma.professor.create({ data: { nome: 'Professora Teste', email: EMAIL } })

  // uma aula em cada período, mais uma no sábado pra conferir o RN04
  const aulas = [
    ['TSTA-1', a, s1, 'SEGUNDA', '08:00', '09:40'],
    ['TSTA-2', a, s1, 'SEGUNDA', '19:00', '20:40'],
    ['TSTA-3', a, s2, 'TERCA', '14:00', '15:40'],
    ['TSTA-4', a, s2, 'SABADO', '08:00', '11:40'],
    ['TSTB-1', b, s2, 'SEGUNDA', '19:00', '22:30'],
  ]
  for (const [codigo, curso, sala, diaSemana, horaInicio, horaFim] of aulas) {
    const turma = await prisma.turma.create({
      data: { codigo, semestre: '2026.2', cursoId: curso.id, professorId: prof.id },
    })
    await prisma.horario.create({ data: { turmaId: turma.id, salaId: sala.id, diaSemana, horaInicio, horaFim } })
  }

  servidor = app.listen(0)
  await new Promise((ok) => servidor.once('listening', ok))
  base = `http://127.0.0.1:${servidor.address().port}`
})

after(async () => {
  servidor.close()
  await limpar()
  await prisma.$disconnect()
})

async function get(caminho) {
  const resposta = await fetch(base + caminho)
  return { status: resposta.status, corpo: await resposta.json() }
}

describe('Período (RN03)', () => {
  test('classifica pela hora de início', () => {
    assert.equal(periodoDe('08:00'), 'MATUTINO')
    assert.equal(periodoDe('11:59'), 'MATUTINO')
    assert.equal(periodoDe('12:00'), 'VESPERTINO')
    assert.equal(periodoDe('17:59'), 'VESPERTINO')
    assert.equal(periodoDe('18:00'), 'NOTURNO')
  })
})

describe('GET /api/aulas', () => {
  test('filtra por curso e não traz sábado (RF04, RN04)', async () => {
    const { status, corpo } = await get('/api/aulas?curso=TSTA')
    assert.equal(status, 200)
    assert.equal(corpo.length, 3)
    for (const aula of corpo) {
      assert.equal(aula.curso.codigo, 'TSTA')
      assert.notEqual(aula.dia, 'SABADO')
    }
  })

  test('traz docente, turma e horário (RF08 a RF10)', async () => {
    const { corpo } = await get('/api/aulas?turma=TSTA-2')
    assert.equal(corpo.length, 1)
    const [aula] = corpo
    assert.equal(aula.professor.nome, 'Professora Teste')
    assert.equal(aula.turma.codigo, 'TSTA-2')
    assert.equal(aula.inicio, '19:00')
    assert.equal(aula.fim, '20:40')
    assert.equal(aula.periodo, 'NOTURNO')
    assert.equal(aula.professor.email, undefined, 'e-mail não deve ser exposto')
  })

  test('filtra por período (RF05)', async () => {
    const { corpo } = await get('/api/aulas?curso=TSTA&periodo=vespertino')
    assert.deepEqual(corpo.map((a) => a.turma.codigo), ['TSTA-3'])
  })

  test('filtra por dia (RF06)', async () => {
    const { corpo } = await get('/api/aulas?curso=TSTA&dia=SEGUNDA')
    assert.deepEqual(corpo.map((a) => a.inicio), ['08:00', '19:00'])
  })

  test('aulas da sala selecionada (RF07)', async () => {
    const { corpo } = await get('/api/aulas?sala=tst-102')
    assert.deepEqual(corpo.map((a) => a.turma.codigo).sort(), ['TSTA-3', 'TSTB-1'])
  })

  test('combina filtros: só o que atende a todos (RF11)', async () => {
    const { corpo } = await get('/api/aulas?curso=TSTA&dia=SEGUNDA&periodo=NOTURNO&sala=TST-101')
    assert.deepEqual(corpo.map((a) => a.turma.codigo), ['TSTA-2'])
  })

  test('filtros sem resultado devolvem lista vazia (RF15)', async () => {
    const { status, corpo } = await get('/api/aulas?curso=TSTB&periodo=MATUTINO')
    assert.equal(status, 200)
    assert.deepEqual(corpo, [])
  })

  test('sem filtro, só segunda a sexta (RN04)', async () => {
    const { corpo } = await get('/api/aulas')
    assert.ok(corpo.length > 0)
    for (const aula of corpo) assert.ok(['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA'].includes(aula.dia))
  })

  for (const [query, motivo] of [
    ['dia=SABADO', 'sábado fora da consulta (RN04)'],
    ['dia=DOMINGO', 'dia inexistente'],
    ['periodo=MADRUGADA', 'período inexistente'],
    ['professor=abc', 'professor não numérico'],
    ['sala=x&sala=y', 'filtro repetido'],
    ['sala=%27%3B%20DROP%20TABLE', 'caracteres inválidos'],
  ]) {
    test(`responde 400 para ${motivo}`, async () => {
      const { status, corpo } = await get(`/api/aulas?${query}`)
      assert.equal(status, 400)
      assert.ok(corpo.erro)
    })
  }
})

describe('Turmas e professores', () => {
  test('turmas filtradas por curso', async () => {
    const { status, corpo } = await get('/api/turmas?curso=TSTB')
    assert.equal(status, 200)
    assert.deepEqual(corpo.map((t) => t.codigo), ['TSTB-1'])
    assert.equal(corpo[0].professor.email, undefined)
  })

  test('professores sem e-mail', async () => {
    const { corpo } = await get('/api/professores')
    const prof = corpo.find((p) => p.nome === 'Professora Teste')
    assert.ok(prof)
    assert.equal(prof.email, undefined)
  })

  test('documentação no ar', async () => {
    assert.equal((await get('/api/docs/openapi.json')).status, 200)
  })
})
