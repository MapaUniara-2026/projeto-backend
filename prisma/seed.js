// Dados de exemplo para desenvolvimento local: npm run db:seed
// Não rode em QA/PRD.
import 'dotenv/config'
import { prisma } from '../src/lib/prisma.js'

const curso = await prisma.curso.upsert({
  where: { codigo: 'ES' },
  update: {},
  create: { codigo: 'ES', nome: 'Engenharia de Software' },
})

const professor = await prisma.professor.upsert({
  where: { email: 'ana.souza@exemplo.edu.br' },
  update: {},
  create: { nome: 'Ana Souza', email: 'ana.souza@exemplo.edu.br' },
})

const sala = await prisma.sala.upsert({
  where: { codigo: 'B-101' },
  update: {},
  create: { codigo: 'B-101', bloco: 'B', capacidade: 40 },
})

const turma = await prisma.turma.upsert({
  where: { codigo_semestre: { codigo: 'ES-3A', semestre: '2026.2' } },
  update: {},
  create: { codigo: 'ES-3A', semestre: '2026.2', cursoId: curso.id, professorId: professor.id },
})

await prisma.horario.upsert({
  where: { salaId_diaSemana_horaInicio: { salaId: sala.id, diaSemana: 'SEGUNDA', horaInicio: '19:00' } },
  update: {},
  create: { turmaId: turma.id, salaId: sala.id, diaSemana: 'SEGUNDA', horaInicio: '19:00', horaFim: '22:30' },
})

console.log('Seed concluído ✅')
await prisma.$disconnect()
