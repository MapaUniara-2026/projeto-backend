// Dados de exemplo para desenvolvimento local: npm run db:seed
// Não rode em QA/PRD. Pode rodar várias vezes: nada é duplicado.
//
// Fontes (tarefa 1.3 — seed único):
//  - Salas: inventário do térreo da Unidade 4 (projeto-frontend/src/data/andares/terreo/salas.js).
//  - Aulas: dados de exemplo do front (projeto-frontend/src/data/aulas.js), os mesmos do PR #13.
//  - Modelo: schema do PR #5 (Sala, Imagem, Curso, Disciplina, Professor, Turma, Aula).
import 'dotenv/config'
import { prisma } from '../src/lib/prisma.js'

// "19:00" -> Date. Colunas TIME guardam só a hora; o Prisma exige um Date, então usamos 1970-01-01 em UTC.
const hora = (hhmm) => new Date(`1970-01-01T${hhmm}:00Z`)

// RN03: antes de 12:00 é MATUTINO, de 12:00 a 17:59 é VESPERTINO, a partir de 18:00 é NOTURNO.
const periodoDe = (hhmm) => (hhmm < '12:00' ? 'MATUTINO' : hhmm < '18:00' ? 'VESPERTINO' : 'NOTURNO')

// Para tabelas sem campo único (imagem, disciplina, professor, turma): busca e, se não achar, cria.
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
const CURSOS = { SI: 'Sistemas de Informação', EC: 'Engenharia de Computação', IA: 'Inteligência Artificial' }
const curso = {}
for (const [sigla, nome] of Object.entries(CURSOS)) {
  curso[sigla] = await prisma.curso.upsert({ where: { sigla }, update: { nome }, create: { sigla, nome } })
}

// [sala, disciplina, curso, semestre do curso, professor, dia, início, término]
// Turma = curso + semestre (ex.: SI-6A). Período sai da hora de início (RN03).
const AULAS = [
  ['BL4-104', 'Engenharia de Software II', 'SI', 6, 'Carlos Almeida', 'SEGUNDA', '19:00', '20:40'],
  ['BL4-101', 'Banco de Dados', 'SI', 4, 'Marina Duarte', 'SEGUNDA', '08:00', '09:40'],
  ['BL4-102', 'Palestra de Abertura', 'SI', 1, 'Carlos Almeida', 'SEGUNDA', '19:00', '20:40'],
  ['BL4-103', 'Programação Web', 'SI', 4, 'Marina Duarte', 'SEGUNDA', '19:00', '22:40'],
  ['BL4-103', 'Sistemas Operacionais', 'EC', 4, 'André Souza', 'TERCA', '14:00', '17:40'],
  ['BL4-105', 'Visão Computacional', 'IA', 6, 'Helena Rocha', 'QUINTA', '14:00', '17:40'],
  ['BL4-105', 'Física Experimental', 'EC', 2, 'Renato Lima', 'SEXTA', '08:00', '11:40'],
  ['BL4-109', 'Cálculo II', 'EC', 3, 'Renato Lima', 'TERCA', '19:00', '20:40'],
  ['BL4-110', 'Redes de Computadores', 'SI', 5, 'André Souza', 'TERCA', '21:00', '22:40'],
  ['BL4-111', 'Aprendizado de Máquina', 'IA', 5, 'Helena Rocha', 'QUARTA', '19:00', '20:40'],
  ['BL4-112', 'Estruturas de Dados', 'SI', 3, 'Paulo Mendes', 'QUINTA', '19:00', '20:40'],
  ['BL4-113', 'Ética e Cidadania', 'IA', 2, 'Lúcia Prado', 'SEXTA', '19:00', '20:40'],
  ['BL4-114', 'Desenho Técnico', 'EC', 2, 'Tiago Ferraz', 'QUARTA', '08:00', '09:40'],
  ['BL4-114', 'Algoritmos', 'EC', 1, 'Paulo Mendes', 'SEGUNDA', '14:00', '15:40'],
]

for (const [codigoSala, nomeDisciplina, sigla, semestre, nomeProfessor, dia, inicio, fim] of AULAS) {
  const disciplina = await garantir('disciplina', { nome: nomeDisciplina })
  const professor = await garantir('professor', { nome: nomeProfessor })
  const turma = await garantir('turma', { nome: `${sigla}-${semestre}A`, semestre })

  const dados = {
    salaId: sala[codigoSala].id,
    cursoId: curso[sigla].id,
    disciplinaId: disciplina.id,
    professorId: professor.id,
    turmaId: turma.id,
    diaSemana: dia,
    periodo: periodoDe(inicio),
    horaInicio: hora(inicio),
    horaTermino: hora(fim),
  }
  await prisma.aula.upsert({
    where: { salaId_diaSemana_horaInicio: { salaId: dados.salaId, diaSemana: dia, horaInicio: dados.horaInicio } },
    update: dados,
    create: dados,
  })
}

console.log(`Seed concluído ✅ (${salas.length} salas, ${imagens.length} imagens, ${AULAS.length} aulas)`)
await prisma.$disconnect()
