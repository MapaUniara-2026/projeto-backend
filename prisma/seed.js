// Dados de exemplo para desenvolvimento local: npm run db:seed
// Não rode em QA/PRD.
// Mesmos dados de exemplo do front (projeto-frontend/src/data/aulas.js), da Unidade 4 (RN01).
import 'dotenv/config'
import { prisma } from '../src/lib/prisma.js'

const SEMESTRE = '2026.2'

const CURSOS = { SI: 'Sistemas de Informação', EC: 'Engenharia de Computação', IA: 'Inteligência Artificial' }

// Só salas e laboratórios (ambientes de serviço não têm aula). Capacidades são de exemplo.
const SALAS = { 'BL4-101': 40, 'BL4-102': 120, 'BL4-103': 30, 'BL4-104': 40, 'BL4-105': 30, 'BL4-109': 40,
  'BL4-110': 40, 'BL4-111': 40, 'BL4-112': 40, 'BL4-113': 60, 'BL4-114': 40 }

// [sala, curso, semestre do curso, professor, dia, início, fim]
// a disciplina ainda não existe no banco, então fica só no comentário de cada linha
const AULAS = [
  ['BL4-104', 'SI', 6, 'Carlos Almeida', 'SEGUNDA', '19:00', '20:40'], // Engenharia de Software II
  ['BL4-101', 'SI', 4, 'Marina Duarte', 'SEGUNDA', '08:00', '09:40'], // Banco de Dados
  ['BL4-102', 'SI', 1, 'Carlos Almeida', 'SEGUNDA', '19:00', '20:40'], // Palestra de Abertura
  ['BL4-103', 'SI', 4, 'Marina Duarte', 'SEGUNDA', '19:00', '22:40'], // Programação Web
  ['BL4-103', 'EC', 4, 'André Souza', 'TERCA', '14:00', '17:40'], // Sistemas Operacionais
  ['BL4-105', 'IA', 6, 'Helena Rocha', 'QUINTA', '14:00', '17:40'], // Visão Computacional
  ['BL4-105', 'EC', 2, 'Renato Lima', 'SEXTA', '08:00', '11:40'], // Física Experimental
  ['BL4-109', 'EC', 3, 'Renato Lima', 'TERCA', '19:00', '20:40'], // Cálculo II
  ['BL4-110', 'SI', 5, 'André Souza', 'TERCA', '21:00', '22:40'], // Redes de Computadores
  ['BL4-111', 'IA', 5, 'Helena Rocha', 'QUARTA', '19:00', '20:40'], // Aprendizado de Máquina
  ['BL4-112', 'SI', 3, 'Paulo Mendes', 'QUINTA', '19:00', '20:40'], // Estruturas de Dados
  ['BL4-113', 'IA', 2, 'Lúcia Prado', 'SEXTA', '19:00', '20:40'], // Ética e Cidadania
  ['BL4-114', 'EC', 2, 'Tiago Ferraz', 'QUARTA', '08:00', '09:40'], // Desenho Técnico
  ['BL4-114', 'EC', 1, 'Paulo Mendes', 'SEGUNDA', '14:00', '15:40'], // Algoritmos
]

// "André Souza" -> "andre.souza@exemplo.edu.br"
const emailDe = (nome) => `${nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(' ', '.')}@exemplo.edu.br`

const cursos = {}
for (const [codigo, nome] of Object.entries(CURSOS)) {
  cursos[codigo] = await prisma.curso.upsert({ where: { codigo }, update: {}, create: { codigo, nome } })
}

const salas = {}
for (const [codigo, capacidade] of Object.entries(SALAS)) {
  salas[codigo] = await prisma.sala.upsert({ where: { codigo }, update: {}, create: { codigo, bloco: 'BL4', capacidade } })
}

const professores = {}
for (const nome of new Set(AULAS.map((a) => a[3]))) {
  const email = emailDe(nome)
  professores[nome] = await prisma.professor.upsert({ where: { email }, update: {}, create: { nome, email } })
}

// Uma turma por aula, com código no formato CURSO+SEMESTRE-Nº (ex.: SI6-01).
for (const [i, [sala, curso, semestreCurso, professor, diaSemana, horaInicio, horaFim]] of AULAS.entries()) {
  const codigo = `${curso}${semestreCurso}-${String(i + 1).padStart(2, '0')}`
  const turma = await prisma.turma.upsert({
    where: { codigo_semestre: { codigo, semestre: SEMESTRE } },
    update: {},
    create: { codigo, semestre: SEMESTRE, cursoId: cursos[curso].id, professorId: professores[professor].id },
  })
  await prisma.horario.upsert({
    where: { salaId_diaSemana_horaInicio: { salaId: salas[sala].id, diaSemana, horaInicio } },
    update: {},
    create: { turmaId: turma.id, salaId: salas[sala].id, diaSemana, horaInicio, horaFim },
  })
}

console.log('Seed concluído ✅')
await prisma.$disconnect()
