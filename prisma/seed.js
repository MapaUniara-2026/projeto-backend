// Dados para desenvolvimento local: npm run db:seed
// Não rode em QA/PRD (as fotos são de exemplo). Pode rodar várias vezes: nada é duplicado.
//
// Fontes (tarefa 1.3 — seed único):
//  - Salas: inventário do térreo da Unidade 4 (projeto-frontend/src/data/andares/terreo/salas.js).
//  - Cursos e aulas: horários reais de 2026 (prisma/dados/horarios/), gravados por prisma/importar-horarios.js.
//  - Modelo: schema do PR #5 (Sala, Imagem, Curso, Disciplina, Professor, Turma, Aula).
import 'dotenv/config'
import { prisma } from '../src/lib/prisma.js'
import { importarHorarios } from './importar-horarios.js'

// Para tabelas sem campo único (ex.: imagem): busca e, se não achar, cria.
async function garantir(modelo, dados) {
  return (await prisma[modelo].findFirst({ where: dados })) ?? prisma[modelo].create({ data: dados })
}

// ---------- Salas (D1 - dados do mapa) ----------
// Tipos: SALA_DE_AULA, LABORATORIO, AUDITORIO, SERVICO, CIRCULACAO (proposta enviada aos DBAs).
// Andar: 0 = térreo. Só o térreo está mapeado no front; 1º e 2º andar entram quando a planta for importada.
// Corredores e escadas (CIRCULACAO) ainda não têm código no inventário; entram junto com eles.
// localizacaoMapa: provisório — combinar com o front o formato (id do elemento no SVG, coordenadas...).
const TERREO = 0
const salas = [
  ['BL4-101', 'Sala 101', 'SALA_DE_AULA'],
  ['BL4-102', 'Auditório', 'AUDITORIO'],
  ['BL4-103', 'Laboratório de Informática 7', 'LABORATORIO'],
  ['BL4-104', 'Sala 104', 'SALA_DE_AULA'],
  ['BL4-105', 'Laboratório de Informática 2', 'LABORATORIO'],
  ['BL4-106', 'Biblioteca', 'SERVICO'],
  ['BL4-107', 'Cantina', 'SERVICO'],
  ['BL4-108', 'Secretaria', 'SERVICO'],
  ['BL4-109', 'Sala 109', 'SALA_DE_AULA'],
  ['BL4-110', 'Sala 110', 'SALA_DE_AULA'],
  ['BL4-111', 'Sala 111', 'SALA_DE_AULA'],
  ['BL4-112', 'Sala 112', 'SALA_DE_AULA'],
  ['BL4-113', 'Sala 113', 'SALA_DE_AULA'],
  ['BL4-114', 'Sala 114', 'SALA_DE_AULA'],
].map(([codigo, nome, tipo]) => ({
  codigo, nome, tipo, bloco: 'BL4', andar: TERREO, localizacaoMapa: `sala-${codigo.toLowerCase()}`,
}))

const sala = {}
for (const s of salas) {
  sala[s.codigo] = await prisma.sala.upsert({ where: { codigo: s.codigo }, update: s, create: s })
}

// Fotos: URLs de exemplo até o levantamento presencial; descricao é o texto alternativo (RNF10).
// BL4-104 tem fotos e BL4-110 fica SEM fotos de propósito: os testes do contrato usam as duas.
const imagens = [
  ['BL4-104', 'frente', 'Sala 104 vista da porta, com carteiras enfileiradas voltadas para a lousa'],
  ['BL4-104', 'fundo', 'Fundo da Sala 104, com o projetor no teto e a porta à direita'],
  ['BL4-102', 'palco', 'Auditório visto da entrada, com as poltronas descendo até o palco'],
  ['BL4-103', 'bancadas', 'Laboratório de Informática 7 com bancadas de computadores em fileiras'],
  ['BL4-106', 'balcao', 'Balcão de atendimento da Biblioteca logo após a entrada'],
]
for (const [codigo, vista, descricao] of imagens) {
  const url = `https://placehold.co/800x600?text=${codigo}+${vista}`
  await garantir('imagem', { salaId: sala[codigo].id, url, descricao })
}

// ---------- Dados acadêmicos (D2) ----------
// Cursos e aulas vêm dos CSVs de horários (as salas acima precisam existir antes).
// Em QA/PRD, onde o seed não roda, a mesma importação é feita com: npm run db:importar-horarios
await importarHorarios()

console.log(`Seed concluído ✅ (${salas.length} salas, ${imagens.length} imagens)`)
await prisma.$disconnect()
