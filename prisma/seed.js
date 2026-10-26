// Dados de exemplo para desenvolvimento local: npm run db:seed
// Não rode em QA/PRD. Pode rodar várias vezes: nada é duplicado.
import 'dotenv/config'
import { prisma } from '../src/lib/prisma.js'

// "19:00" -> Date. Colunas TIME guardam só a hora; o Prisma exige um Date, então usamos 1970-01-01 em UTC.
const hora = (hhmm) => new Date(`1970-01-01T${hhmm}:00Z`)

// Para tabelas sem campo único (disciplina, professor, turma): busca e, se não achar, cria.
async function garantir(modelo, dados) {
  return (await prisma[modelo].findFirst({ where: dados })) ?? prisma[modelo].create({ data: dados })
}

// ---------- Salas (D1 - dados do mapa) ----------
// localizacaoMapa: provisório — combinar com o front o formato (id do elemento no SVG, coordenadas...).
const salas = [
  { codigo: 'BL4-101', nome: 'Sala 101', bloco: 'BL4', andar: 1, tipo: 'SALA_DE_AULA', localizacaoMapa: 'sala-bl4-101' },
  { codigo: 'BL4-104', nome: 'Laboratório de Informática 1', bloco: 'BL4', andar: 1, tipo: 'LABORATORIO', localizacaoMapa: 'sala-bl4-104' },
  { codigo: 'BL4-201', nome: 'Sala 201', bloco: 'BL4', andar: 2, tipo: 'SALA_DE_AULA', localizacaoMapa: 'sala-bl4-201' },
  { codigo: 'BL4-202', nome: 'Auditório', bloco: 'BL4', andar: 2, tipo: 'AUDITORIO', localizacaoMapa: 'sala-bl4-202' }, // sem fotos de propósito: testa fotos: []
]
const sala = {}
for (const s of salas) {
  sala[s.codigo] = await prisma.sala.upsert({ where: { codigo: s.codigo }, update: s, create: s })
}

// Fotos: URLs de exemplo; descricao é o texto alternativo (RNF10).
const imagens = [
  { codigo: 'BL4-104', url: 'https://placehold.co/800x600?text=BL4-104+frente', descricao: 'Laboratório 1 visto da porta, com bancadas de computadores' },
  { codigo: 'BL4-104', url: 'https://placehold.co/800x600?text=BL4-104+fundo', descricao: 'Fundo do Laboratório 1, com projetor e lousa' },
  { codigo: 'BL4-201', url: 'https://placehold.co/800x600?text=BL4-201', descricao: 'Sala 201 com carteiras enfileiradas' },
]
for (const { codigo, ...img } of imagens) {
  await garantir('imagem', { ...img, salaId: sala[codigo].id })
}

// ---------- Dados acadêmicos (D2) ----------
const curso = {}
for (const c of [
  { sigla: 'SI', nome: 'Sistemas de Informação' },
  { sigla: 'ES', nome: 'Engenharia de Software' },
]) {
  curso[c.sigla] = await prisma.curso.upsert({ where: { sigla: c.sigla }, update: c, create: c })
}

const disc = {
  so: await garantir('disciplina', { nome: 'Sistemas Operacionais' }),
  bd: await garantir('disciplina', { nome: 'Banco de Dados' }),
  es: await garantir('disciplina', { nome: 'Engenharia de Software II' }),
  calc: await garantir('disciplina', { nome: 'Cálculo I' }),
}

const prof = {
  ana: await garantir('professor', { nome: 'Ana Souza' }),
  bruno: await garantir('professor', { nome: 'Bruno Lima' }),
  carla: await garantir('professor', { nome: 'Carla Mendes' }),
}

const turma = {
  si3: await garantir('turma', { nome: 'SI-3A', semestre: 3 }),
  es3: await garantir('turma', { nome: 'ES-3A', semestre: 3 }),
  es1: await garantir('turma', { nome: 'ES-1A', semestre: 1 }),
}

// ---------- Aulas ----------
// Cobre os três períodos e vários dias, para os filtros terem o que devolver.
// A primeira bate com os testes da coleção: curso=ES, dia=SEGUNDA, periodo=NOTURNO, sala BL4-104 às 19:30.
const aulas = [
  { sala: 'BL4-104', curso: 'ES', disciplina: disc.es, professor: prof.ana, turma: turma.es3, dia: 'SEGUNDA', periodo: 'NOTURNO', inicio: '19:00', fim: '22:30' },
  { sala: 'BL4-101', curso: 'SI', disciplina: disc.so, professor: prof.bruno, turma: turma.si3, dia: 'SEGUNDA', periodo: 'NOTURNO', inicio: '19:00', fim: '20:40' },
  { sala: 'BL4-104', curso: 'SI', disciplina: disc.bd, professor: prof.carla, turma: turma.si3, dia: 'TERCA', periodo: 'NOTURNO', inicio: '19:00', fim: '22:30' },
  { sala: 'BL4-201', curso: 'ES', disciplina: disc.calc, professor: prof.bruno, turma: turma.es1, dia: 'QUARTA', periodo: 'MATUTINO', inicio: '08:00', fim: '11:40' },
  { sala: 'BL4-202', curso: 'ES', disciplina: disc.es, professor: prof.ana, turma: turma.es3, dia: 'QUINTA', periodo: 'VESPERTINO', inicio: '14:00', fim: '17:30' },
  { sala: 'BL4-101', curso: 'SI', disciplina: disc.so, professor: prof.bruno, turma: turma.si3, dia: 'SEXTA', periodo: 'NOTURNO', inicio: '20:50', fim: '22:30' },
]
for (const a of aulas) {
  const dados = {
    salaId: sala[a.sala].id,
    cursoId: curso[a.curso].id,
    disciplinaId: a.disciplina.id,
    professorId: a.professor.id,
    turmaId: a.turma.id,
    diaSemana: a.dia,
    periodo: a.periodo,
    horaInicio: hora(a.inicio),
    horaTermino: hora(a.fim),
  }
  await prisma.aula.upsert({
    where: { salaId_diaSemana_horaInicio: { salaId: dados.salaId, diaSemana: a.dia, horaInicio: dados.horaInicio } },
    update: dados,
    create: dados,
  })
}

console.log(`Seed concluído ✅ (${salas.length} salas, ${imagens.length} imagens, ${aulas.length} aulas)`)
await prisma.$disconnect()