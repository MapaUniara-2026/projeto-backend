// Importa os horários reais (CSVs em prisma/dados/horarios/) para a tabela de aulas.
//
// Uso (o banco é o do DATABASE_URL):
//   npm run db:importar-horarios -- --simular   mostra o que entraria e o que ficaria de fora; não grava nada
//   npm run db:importar-horarios                grava
// O prisma/seed.js também chama esta importação.
//
// Pode rodar quantas vezes quiser: as aulas dos cursos dos CSVs são apagadas e recriadas a partir dos
// arquivos, numa transação (se algo falhar, o banco fica como estava). O inventário de salas (prisma/dados/salas.json)
// é sincronizado antes: salas novas são criadas e as antigas fora do inventário e sem aula são removidas.
//
// Formato dos CSVs (UTF-8, separador ";", 1ª linha = cabeçalho):
//   Dia;Horário;Semestre;Sala;Disciplina;Professor;Compartilhada com
//   Segunda;19:00;2º Semestre;109;Alg. De Prog. I;Felipe Diniz;Eng. Comp. + Sist. Inf.
//  - Horário: início como aparece na grade impressa (19:00, 20:20, 20:40 ou 22:00).
//  - Sala: duas salas separadas por " / " (ex.: "112 / Lab. Inf. 2").
//  - "Compartilhada com" é só informativo: aula compartilhada é reconhecida por dia + horário + professor.
//
// Novo semestre: troque os CSVs, rode com --simular, confira o relatório e rode sem --simular.
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { prisma } from '../src/lib/prisma.js'

const PASTA = new URL('./dados/horarios/', import.meta.url)

// ======================= REGRAS DE CONVERSÃO (ajuste aqui) =======================

// Um CSV por curso. A ordem é a prioridade quando o modelo não comporta a aula para todos os cursos
// (ex.: aula compartilhada com uma sala só fica com o primeiro curso desta lista).
export const CURSOS = [
  { sigla: 'EC', nome: 'Engenharia de Computação', arquivo: 'horarios_engenharia_computacao.csv' },
  { sigla: 'IA', nome: 'Inteligência Artificial', arquivo: 'horarios_inteligencia_artificial.csv' },
  { sigla: 'SI', nome: 'Sistemas de Informação', arquivo: 'horarios_sistemas_informacao.csv' },
]

// Inventário das salas da Unidade 4 (térreo e 1º, 2º e 3º andares), conferido com as plantas do front
// (projeto-frontend/tools/plantas). O código é o mesmo `id` das áreas clicáveis do mapa.
export const SALAS = JSON.parse(readFileSync(new URL('./dados/salas.json', import.meta.url), 'utf8'))

// Grafias do horário -> código da sala no inventário. Números de sala ("211", "315A") e "T<n>" viram BL4-<nome>.
// "Lab. 2" e "Lab. Inf. 2" são a mesma sala (a mesma aula aparece com os dois nomes em SI e EC).
// "Lab. Inf. 3/4/5" são os "Lab. 3/4/5" do 1º andar. "Lab. 1" NÃO é o "Lab. Inf. 1": há aulas nos dois no mesmo horário.
// A CONFIRMAR com a coordenação: L. Fís. Exp. = Lab. Física (1º andar). "Lab. 1", "Lab. Eletrônica" e
// "Lab. Elet. 1" não aparecem nas plantas e ficam como "pendente" (fora do mapa) até alguém indicar onde ficam.
const SALA_ALIAS = {
  'Lab. Inf. 1': 'BL4-LAB-INF-1',
  'Lab. Inf. 2': 'BL4-LAB-INF-2',
  'Lab. 2': 'BL4-LAB-INF-2',
  'Lab. Inf. 7': 'BL4-LAB-INF-7',
  'Lab. 3': 'BL4-LAB-3',
  'Lab. Inf. 3': 'BL4-LAB-3',
  'Lab. 4': 'BL4-LAB-4',
  'Lab. Inf. 4': 'BL4-LAB-4',
  'Lab. 5': 'BL4-LAB-5',
  'Lab. Inf. 5': 'BL4-LAB-5',
  'L. Fís. Exp.': 'BL4-LAB-FISICA',
  'Lab. 1': 'BL4-LAB-1',
  'Lab. Eletrônica': 'BL4-LAB-ELETRONICA',
  'Lab. Elet. 1': 'BL4-LAB-ELETRONICA',
}

// Sala como aparece no horário -> código da sala (ex.: "211" -> BL4-211; "Lab. 2" -> BL4-LAB-INF-2).
export function codigoDaSala(nome) {
  const n = nome.trim()
  if (SALA_ALIAS[n]) return SALA_ALIAS[n]
  if (/^(\d{3}[A-Z]?|T\d+)$/i.test(n)) return `BL4-${n.toUpperCase()}`
  return `BL4-${n.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '')}`.slice(0, 20)
}

// Sala do horário que não está no inventário: criada com localizacaoMapa "pendente" (não aparece no mapa).
const salaSemPlanta = (codigo) => ({
  codigo,
  nome: codigo.replace(/^BL4-/, ''),
  bloco: 'BL4',
  andar: /^BL4-[1-3]\d\d/.test(codigo) ? Number(codigo[4]) : 0,
  tipo: /LAB/.test(codigo) ? 'LABORATORIO' : 'SALA_DE_AULA',
  localizacaoMapa: 'pendente',
})

// Grafias diferentes do mesmo professor nos horários -> nome gravado. Confirmar com a coordenação.
const PROFESSOR = {
  'Flavia Ferreira': 'Flávia Ferreira',
  'Fabina Florian': 'Fabiana Florian',
  'João H. G. Borges': 'João G. H. Borges',
  'João. G. Borges': 'João G. H. Borges',
  'Renata Farina': 'Renata M. Farina',
  'André Luis': 'André Luis Silva',
  'Felipe Dalillo': 'Felipe Dallilo',
  'Carmen Lucia': 'Carmem Lúcia',
  'Munhoz': 'Alexandre Munhoz',
  'Sabrina': 'Sabrina Piva',
}
const SEM_PROFESSOR = 'A definir' // a tabela de aulas exige professor

// Rótulo da grade -> horário real. 19:00/20:20 e 20:40/22:00 são início e fim de cada bloco;
// célula dividida na grade = duas metades de 40 min (a 2ª metade vem com o rótulo 20:20 ou 22:00).
const BLOCO = { '19:00': ['19:00', '20:20'], '20:40': ['20:40', '22:00'] }
const METADE = { '19:00': ['19:00', '19:40'], '20:20': ['19:40', '20:20'], '20:40': ['20:40', '21:20'], '22:00': ['21:20', '22:00'] }
const SEGUNDA_METADE = { '19:00': '20:20', '20:40': '22:00' }

// ==================================================================================

const DIAS = { Segunda: 'SEGUNDA', Terça: 'TERCA', Quarta: 'QUARTA', Quinta: 'QUINTA', Sexta: 'SEXTA' }
const CABECALHO = 'Dia;Horário;Semestre;Sala;Disciplina;Professor;Compartilhada com'

// "19:00" -> Date usado nas colunas TIME (mesma convenção do seed e de src/lib/horarios.js).
const hora = (hhmm) => new Date(`1970-01-01T${hhmm}:00Z`)
// RN03: antes de 12:00 é MATUTINO, de 12:00 a 17:59 é VESPERTINO, a partir de 18:00 é NOTURNO.
const periodoDe = (hhmm) => (hhmm < '12:00' ? 'MATUTINO' : hhmm < '18:00' ? 'VESPERTINO' : 'NOTURNO')
const seSobrepoem = (a, b) => a.inicio < b.fim && b.inicio < a.fim
const descrever = (a) => `${a.curso.sigla} ${a.etapa}º ${a.diaCsv} ${a.inicio} ${a.disciplina}`
class Simulacao extends Error {}

// Separa uma linha do CSV por ";" respeitando campos entre aspas.
function dividir(linha) {
  const campos = ['']
  let aspas = false
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i]
    if (c === '"' && aspas && linha[i + 1] === '"') campos[campos.length - 1] += linha[i++]
    else if (c === '"') aspas = !aspas
    else if (c === ';' && !aspas) campos.push('')
    else campos[campos.length - 1] += c
  }
  return campos.map((c) => c.trim())
}

// Lê e valida os CSVs. Qualquer linha inválida interrompe a importação antes de tocar no banco.
function lerCsvs() {
  const erros = []
  const linhas = []
  for (const curso of CURSOS) {
    const texto = readFileSync(new URL(curso.arquivo, PASTA), 'utf8').replace(/^﻿/, '')
    const [cabecalho, ...resto] = texto.split(/\r?\n/)
    if (cabecalho.trim() !== CABECALHO) {
      erros.push(`${curso.arquivo}: cabeçalho deve ser "${CABECALHO}"`)
      continue
    }
    resto.forEach((texto, i) => {
      if (!texto.trim()) return
      const erro = (msg) => erros.push(`${curso.arquivo}, linha ${i + 2}: ${msg}`)
      const campos = dividir(texto)
      if (campos.length !== 7) return erro(`esperava 7 colunas, veio ${campos.length}`)
      const [dia, horario, semestre, sala, disciplina, professor] = campos
      const etapa = /^(\d{1,2})º Semestre$/.exec(semestre)?.[1]
      if (!DIAS[dia]) return erro(`dia "${dia}" inválido (use ${Object.keys(DIAS).join(', ')})`)
      if (!METADE[horario]) return erro(`horário "${horario}" não é um rótulo da grade (19:00, 20:20, 20:40 ou 22:00)`)
      if (!etapa) return erro(`semestre "${semestre}" fora do formato "2º Semestre"`)
      if (!sala || !disciplina) return erro('sala e disciplina são obrigatórias')
      linhas.push({
        curso, linhaCsv: i + 2, diaCsv: dia, dia: DIAS[dia], horario, etapa: Number(etapa),
        salas: sala.split(' / ').map((s) => s.trim()), disciplina,
        professor: PROFESSOR[professor] ?? (professor || SEM_PROFESSOR), semProfessor: !professor,
      })
    })
  }
  if (erros.length) throw new Error(`CSV com erro, nada foi importado:\n  - ${erros.join('\n  - ')}`)

  for (const a of linhas) {
    const metade = !BLOCO[a.horario] || linhas.some((o) =>
      o.curso === a.curso && o.etapa === a.etapa && o.dia === a.dia && o.horario === SEGUNDA_METADE[a.horario])
    ;[a.inicio, a.fim] = (metade ? METADE : BLOCO)[a.horario]
  }
  return linhas
}


// Junta as linhas que são a mesma aula: mesmo dia, início e professor em mais de um curso (aula compartilhada).
// Cada grupo guarda as salas do horário e quais já foram usadas pela própria aula.
function agrupar(linhas) {
  const grupos = new Map()
  for (const a of linhas) {
    const chave = a.semProfessor ? `${a.curso.sigla}#${a.linhaCsv}` : `${a.dia}|${a.inicio}|${a.professor}`
    if (!grupos.has(chave)) grupos.set(chave, { linhas: 0, salas: [], usadas: new Map() })
    a.grupo = grupos.get(chave)
    a.grupo.linhas++
    for (const codigo of a.salas.map(codigoDaSala)) if (!a.grupo.salas.includes(codigo)) a.grupo.salas.push(codigo)
  }
  // Ordem de gravação = prioridade dos cursos (ver CURSOS), depois a linha do CSV.
  return linhas.sort((a, b) => CURSOS.indexOf(a.curso) - CURSOS.indexOf(b.curso) || a.linhaCsv - b.linhaCsv)
}

export async function importarHorarios({ simular = false, log = console.log } = {}) {
  const linhas = agrupar(lerCsvs())
  const recusadas = []
  const avisos = linhas.filter((a) => a.semProfessor).map((a) => `${descrever(a)}: sem professor no CSV, gravada como "${SEM_PROFESSOR}"`)
  const resumo = { porCurso: {}, salasCriadas: [] }

  try {
    await prisma.$transaction(async (tx) => {
      const curso = {}
      for (const { sigla, nome } of CURSOS) {
        curso[sigla] = await tx.curso.upsert({ where: { sigla }, update: { nome }, create: { sigla, nome } })
      }

      // Salas: o inventário é sincronizado (cria ou atualiza); salas do horário fora dele são criadas como "pendente".
      for (const s of SALAS) {
        const dados = { ...s, bloco: 'BL4' }
        await tx.sala.upsert({ where: { codigo: s.codigo }, update: dados, create: dados })
      }
      const codigos = [...new Set(linhas.flatMap((a) => a.grupo.salas))]
      const existentes = new Map((await tx.sala.findMany({ where: { codigo: { in: codigos } } })).map((s) => [s.codigo, s]))
      for (const codigo of codigos.filter((c) => !existentes.has(c))) {
        existentes.set(codigo, await tx.sala.create({ data: salaSemPlanta(codigo) }))
        resumo.salasCriadas.push(codigo)
      }

      // As aulas desses cursos são recriadas a partir dos CSVs.
      const ids = Object.values(curso).map((c) => c.id)
      await tx.aula.deleteMany({ where: { cursoId: { in: ids } } })

      // Ocupação: aulas de outros cursos que ficaram no banco + as gravadas nesta importação.
      // Checa sobreposição de verdade (19:00-22:00 x 21:20-22:00), não só o mesmo início como o índice único.
      const outras = await tx.aula.findMany({ select: { salaId: true, diaSemana: true, horaInicio: true, horaTermino: true } })
      const ocupacao = outras.map((o) => ({
        salaId: o.salaId, dia: o.diaSemana, inicio: o.horaInicio.toISOString().slice(11, 16), fim: o.horaTermino.toISOString().slice(11, 16),
        descricao: 'aula de outro curso',
      }))

      const buscarOuCriar = async (modelo, dados, cache) => {
        const chave = JSON.stringify(dados)
        if (!cache.has(chave)) cache.set(chave, (await tx[modelo].findFirst({ where: dados })) ?? (await tx[modelo].create({ data: dados })))
        return cache.get(chave)
      }
      const caches = { disciplina: new Map(), professor: new Map(), turma: new Map() }

      // Regras do modelo atual (uma aula = um curso; uma sala por turma no mesmo horário):
      //  - cada linha fica com a 1ª sala do horário que estiver livre e não tiver sido usada pela mesma aula;
      //  - aula compartilhada: cada curso fica com uma das salas, na ordem de CURSOS; sem sala livre, fica de fora;
      //  - aula de um curso só com duas salas: fica numa só (as outras vão para os avisos).
      for (const a of linhas) {
        const turmaNome = `${a.curso.sigla}-${a.etapa}A` // turma = curso + semestre, como no seed
        const choqueTurma = ocupacao.find((o) => o.turma === turmaNome && o.dia === a.dia && seSobrepoem(o, a))
        if (choqueTurma) {
          recusadas.push(`${descrever(a)}: turma ${turmaNome} já tem aula no horário (${choqueTurma.descricao})`)
          continue
        }
        const ocupadaPor = (codigo) => ocupacao.find((o) => o.salaId === existentes.get(codigo).id && o.dia === a.dia && seSobrepoem(o, a))
        const livre = a.grupo.salas.find((c) => !a.grupo.usadas.has(c) && !ocupadaPor(c))
        if (!livre) {
          recusadas.push(`${descrever(a)}: sem sala livre (${a.grupo.salas.map((c) => a.grupo.usadas.has(c)
            ? `${c} com a mesma aula de ${a.grupo.usadas.get(c)}`
            : `${c} ocupada por ${ocupadaPor(c).descricao}`).join('; ')})`)
          continue
        }
        a.grupo.usadas.set(livre, a.curso.sigla)
        if (a.grupo.linhas === 1 && a.grupo.salas.length > 1) {
          avisos.push(`${descrever(a)}: gravada só em ${livre} (horário tem ${a.salas.join(' / ')})`)
        }
        const sala = existentes.get(livre)
        const disciplina = await buscarOuCriar('disciplina', { nome: a.disciplina }, caches.disciplina)
        const professor = await buscarOuCriar('professor', { nome: a.professor }, caches.professor)
        const turma = await buscarOuCriar('turma', { nome: turmaNome, semestre: a.etapa }, caches.turma)
        await tx.aula.create({
          data: {
            salaId: sala.id, cursoId: curso[a.curso.sigla].id, disciplinaId: disciplina.id, professorId: professor.id,
            turmaId: turma.id, diaSemana: a.dia, periodo: periodoDe(a.inicio), horaInicio: hora(a.inicio), horaTermino: hora(a.fim),
          },
        })
        ocupacao.push({ salaId: sala.id, turma: turmaNome, dia: a.dia, inicio: a.inicio, fim: a.fim, descricao: descrever(a) })
        resumo.porCurso[a.curso.sigla] = (resumo.porCurso[a.curso.sigla] ?? 0) + 1
      }

      // Disciplinas, professores e turmas que ficaram sem aula (sobras de importações ou seeds anteriores).
      for (const modelo of ['disciplina', 'professor', 'turma']) {
        await tx[modelo].deleteMany({ where: { aulas: { none: {} } } })
      }
      // Fotos de exemplo (placehold.co) são recriadas pelo seed; removê-las evita foto de exemplo presa a um código
      // que mudou de sala. Fotos reais (Supabase Storage) não são tocadas.
      await tx.imagem.deleteMany({ where: { url: { startsWith: 'https://placehold.co/' } } })
      // Salas que não estão no inventário e ficaram sem aula (cadastros antigos ou provisórios). Fotos vão junto.
      const inventario = SALAS.map((s) => s.codigo)
      const removidas = await tx.sala.deleteMany({ where: { codigo: { notIn: inventario }, aulas: { none: {} } } })
      resumo.salasRemovidas = removidas.count
      if (simular) throw new Simulacao()
    }, { timeout: 120_000 })
  } catch (e) {
    if (!(e instanceof Simulacao)) throw e
  }

  const total = Object.values(resumo.porCurso).reduce((s, n) => s + n, 0)
  const porCurso = CURSOS.map((c) => `${c.sigla} ${resumo.porCurso[c.sigla] ?? 0}`).join(', ')
  log(`${simular ? 'Simulação (nada foi gravado)' : 'Horários importados ✅'}: ${total} aulas de ${linhas.length} linhas dos CSVs (${porCurso})`)
  if (resumo.salasRemovidas) log(`  Salas fora do inventário e sem aula ${simular ? 'que seriam removidas' : 'removidas'}: ${resumo.salasRemovidas}`)
  if (resumo.salasCriadas.length) log(`  Salas sem planta ${simular ? 'que seriam criadas' : 'criadas'} (${resumo.salasCriadas.length}): ${resumo.salasCriadas.join(', ')}`)
  if (recusadas.length) log(`  Não gravadas (${recusadas.length}):\n    - ${recusadas.join('\n    - ')}`)
  if (avisos.length) log(`  Avisos (${avisos.length}):\n    - ${avisos.join('\n    - ')}`)
  return { total, porCurso: resumo.porCurso, recusadas, avisos, salasCriadas: resumo.salasCriadas }
}

// Execução direta: npm run db:importar-horarios [-- --simular]
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await importarHorarios({ simular: process.argv.includes('--simular') })
  } catch (e) {
    console.error(e.message)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}
