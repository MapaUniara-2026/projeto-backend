// Consultas de turmas e professores (opções de filtro para o front). Só leitura (RNF08).
// No modelo atual turma e professor não apontam para o curso: o vínculo vem das aulas.
// Por isso ?curso=SI devolve as turmas/professores que têm pelo menos uma aula daquele curso.
import { inteiro, opcional, siglaCurso } from '../lib/validacao.js'
import { ErroValidacao } from '../middlewares/erros.js'

function aceitarSomente(query, permitidos) {
  for (const nome of Object.keys(query)) {
    if (!permitidos.includes(nome)) throw new ErroValidacao(`Filtro não reconhecido: "${nome}".`)
  }
}

const doCurso = (sigla) => (sigla ? { aulas: { some: { curso: { is: { sigla } } } } } : {})

export function montarConsultaTurmas(query = {}) {
  aceitarSomente(query, ['curso', 'semestre'])
  const curso = opcional(siglaCurso)(query.curso, 'curso')
  const semestre = opcional(inteiro)(query.semestre, 'semestre', { min: 1, max: 20 })
  return {
    where: { ...doCurso(curso), ...(semestre ? { semestre } : {}) },
    select: { id: true, nome: true, semestre: true },
    orderBy: [{ semestre: 'asc' }, { nome: 'asc' }],
  }
}

export function montarConsultaProfessores(query = {}) {
  aceitarSomente(query, ['curso'])
  const curso = opcional(siglaCurso)(query.curso, 'curso')
  return {
    where: doCurso(curso),
    select: { id: true, nome: true },
    orderBy: { nome: 'asc' },
  }
}

// Busca sem resultado devolve [] (não é 404).
export const consultarTurmas = (prisma, query) => prisma.turma.findMany(montarConsultaTurmas(query))
export const consultarProfessores = (prisma, query) => prisma.professor.findMany(montarConsultaProfessores(query))
