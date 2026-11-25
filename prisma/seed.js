// Dados para desenvolvimento local: npm run db:seed
// Não rode em QA/PRD (as fotos são de exemplo). Pode rodar várias vezes: nada é duplicado.
//
// Fontes (tarefa 1.3 — seed único):
//  - Salas: inventário dos quatro andares da Unidade 4 (prisma/dados/salas.json), o mesmo do mapa do front.
//  - Cursos e aulas: horários reais de 2026 (prisma/dados/horarios/), gravados por prisma/importar-horarios.js.
//  - Modelo: schema do PR #5 (Sala, Imagem, Curso, Disciplina, Professor, Turma, Aula).
import 'dotenv/config'
import { prisma } from '../src/lib/prisma.js'
import { importarHorarios } from './importar-horarios.js'

// Para tabelas sem campo único (ex.: imagem): busca e, se não achar, cria.
async function garantir(modelo, dados) {
  return (await prisma[modelo].findFirst({ where: dados })) ?? prisma[modelo].create({ data: dados })
}

// ---------- Salas e dados acadêmicos ----------
// A importação sincroniza o inventário de salas (prisma/dados/salas.json, os quatro andares) e grava
// cursos e aulas a partir dos CSVs de horários. Em QA/PRD, onde o seed não roda, use: npm run db:importar-horarios
await importarHorarios()

// ---------- Fotos de exemplo (somente DEV/local) ----------
// URLs provisórias até o levantamento fotográfico; descricao é o texto alternativo (RNF10).
// BL4-104 tem fotos e BL4-110 fica SEM fotos de propósito: os testes do contrato usam as duas.
const imagens = [
  ['BL4-104', 'frente', 'Sala 104 vista da porta, com carteiras enfileiradas voltadas para a lousa'],
  ['BL4-104', 'fundo', 'Fundo da Sala 104, com o projetor no teto e a porta à direita'],
  ['BL4-AUDITORIO', 'palco', 'Auditório visto da entrada, com as poltronas descendo até o palco'],
  ['BL4-LAB-INF-7', 'bancadas', 'Laboratório de Informática 7 com bancadas de computadores em fileiras'],
  ['BL4-BIBLIOTECA', 'balcao', 'Balcão de atendimento da Biblioteca logo após a entrada'],
]
for (const [codigo, vista, descricao] of imagens) {
  const sala = await prisma.sala.findUniqueOrThrow({ where: { codigo } })
  const url = `https://placehold.co/800x600?text=${codigo}+${vista}`
  await garantir('imagem', { salaId: sala.id, url, descricao })
}

console.log(`Seed concluído ✅ (${imagens.length} imagens de exemplo)`)
await prisma.$disconnect()
