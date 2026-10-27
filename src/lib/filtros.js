// Filtros de curso, bloco e sala em funções puras (sem banco), para serem fáceis de testar.
//
// Requisitos do documento que estas regras implementam:
//  - RF04 / RN02  filtrar por curso
//  - RF11         combinar filtros: só entram as aulas que atendem a TODOS os filtros informados
//  - RF14         sala (por código)
//  - RNF08        a entrada é validada; valor inválido vira 400, nunca é repassado "meio certo" ao banco
import { ErroValidacao } from '../middlewares/erros.js'

// Limites para a entrada não virar um problema de desempenho ou de segurança.
export const MAX_VALORES_POR_FILTRO = 50
const MAX_TAMANHO_CODIGO = 20 // mesmo limite das colunas VarChar(20) de código/bloco

// Aceita ?curso=SI&curso=EC e também ?curso=SI,EC. Ignora vazios e repetidos.
function lerLista(query, campo) {
  const bruto = query[campo]
  if (bruto === undefined) return []

  const valores = []
  for (const item of Array.isArray(bruto) ? bruto : [bruto]) {
    if (typeof item !== 'string') throw new ErroValidacao(`Filtro "${campo}" inválido.`)
    for (const parte of item.split(',')) {
      const valor = parte.trim()
      if (valor) valores.push(valor)
    }
  }

  const unicos = [...new Set(valores)]
  if (unicos.length > MAX_VALORES_POR_FILTRO) {
    throw new ErroValidacao(`Filtro "${campo}" aceita no máximo ${MAX_VALORES_POR_FILTRO} valores.`)
  }
  if (unicos.some((v) => v.length > MAX_TAMANHO_CODIGO)) {
    throw new ErroValidacao(`Filtro "${campo}" contém um valor longo demais.`)
  }
  return unicos
}

// Transforma req.query nos filtros normalizados. Parâmetros desconhecidos são ignorados.
export function lerFiltros(query = {}) {
  return {
    cursos: lerLista(query, 'curso'), // códigos de curso (ex.: SI)
    blocos: lerLista(query, 'bloco'),
    salas: lerLista(query, 'sala'), // códigos de sala (ex.: BL4-101)
  }
}

// Monta o `where` do Prisma. Cada filtro informado vira uma condição e todas são combinadas com AND (RF11).
export function montarWhere({ cursos, blocos, salas }) {
  const where = {}

  const sala = {}
  if (blocos.length) sala.bloco = { in: blocos }
  if (salas.length) sala.codigo = { in: salas }
  if (blocos.length || salas.length) where.sala = sala

  if (cursos.length) where.turma = { curso: { codigo: { in: cursos } } }

  return where
}
