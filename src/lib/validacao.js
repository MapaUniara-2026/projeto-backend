// Validação dos dados de entrada (params, query e body).
// Cada função normaliza o valor (trim, maiúsculas) e devolve o valor pronto para usar,
// ou lança ErroValidacao (400 / PARAMETRO_INVALIDO) com uma mensagem para o usuário.
// Não dependem do schema do banco: servem para as rotas atuais e para as que vêm com o DER.
import { ErroValidacao } from '../middlewares/erros.js'

export const DIAS_SEMANA = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO']
export const PERIODOS = ['MATUTINO', 'VESPERTINO', 'NOTURNO']

const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d$/
const REGEX_CODIGO_SALA = /^[A-Z]+\d*-\d+[A-Z]?$/ // ex.: BL4-104 (mapa), B-101
const REGEX_SIGLA_CURSO = /^[A-Z0-9]{2,20}$/ // ex.: SI, ES, EC
const MAIOR_INT = 2_147_483_647 // limite do Int (int4) do PostgreSQL
export const TAMANHO_MAXIMO_BUSCA = 100

const vazio = (valor) => valor === undefined || valor === null || (typeof valor === 'string' && !valor.trim())

const semAcento = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '')

// ?dia=SEGUNDA&dia=TERCA chega como array: aceitamos um valor só por parâmetro.
function textoDe(valor, campo) {
  if (typeof valor === 'number') return String(valor)
  if (typeof valor !== 'string') throw new ErroValidacao(`"${campo}" deve ser um texto com um único valor.`)
  return valor.trim()
}

// Envolve um validador para aceitar ausência: devolve null quando o valor não foi informado.
export const opcional = (validador) => (valor, ...args) => (vazio(valor) ? null : validador(valor, ...args))

export function obrigatorio(valor, campo) {
  if (vazio(valor)) throw new ErroValidacao(`O campo "${campo}" é obrigatório.`)
  return valor
}

// Corpo de POST/PUT: sem JSON (ou com Content-Type errado) o Express deixa req.body undefined.
export function corpo(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new ErroValidacao('Envie um objeto JSON no corpo da requisição (Content-Type: application/json).')
  }
  return body
}

export function texto(valor, campo, { max } = {}) {
  const t = textoDe(obrigatorio(valor, campo), campo)
  if (max && t.length > max) throw new ErroValidacao(`"${campo}" deve ter no máximo ${max} caracteres.`)
  return t
}

export function inteiro(valor, campo, { min = -MAIOR_INT, max = MAIOR_INT } = {}) {
  obrigatorio(valor, campo)
  const n = typeof valor === 'string' && /^-?\d+$/.test(valor.trim()) ? Number(valor) : valor
  if (!Number.isInteger(n) || n < min || n > max) {
    const faixa = max === MAIOR_INT ? `maior ou igual a ${min}` : `entre ${min} e ${max}`
    throw new ErroValidacao(`"${campo}" deve ser um número inteiro ${faixa}.`)
  }
  return n
}

export const id = (valor, campo = 'id') => inteiro(valor, campo, { min: 1 })

// 0 = térreo, 1 = 1º andar...
export const andar = (valor, campo = 'andar') => inteiro(valor, campo, { min: 0, max: 99 })

function daLista(valor, campo, lista) {
  const v = semAcento(textoDe(obrigatorio(valor, campo), campo)).toUpperCase()
  if (!lista.includes(v)) throw new ErroValidacao(`"${campo}" deve ser um destes valores: ${lista.join(', ')}.`)
  return v
}

// Aceita "terça" ou "Terca" e devolve "TERCA".
export const diaSemana = (valor, campo = 'dia') => daLista(valor, campo, DIAS_SEMANA)

export const periodo = (valor, campo = 'periodo') => daLista(valor, campo, PERIODOS)

export function hora(valor, campo = 'hora') {
  const h = textoDe(obrigatorio(valor, campo), campo)
  if (!REGEX_HORA.test(h)) throw new ErroValidacao(`"${campo}" deve estar no formato HH:MM (00:00 a 23:59).`)
  return h
}

export function codigoSala(valor, campo = 'codigo') {
  const c = textoDe(obrigatorio(valor, campo), campo).toUpperCase()
  if (c.length > 20 || !REGEX_CODIGO_SALA.test(c)) {
    throw new ErroValidacao(`"${campo}" deve seguir o formato do mapa, ex.: BL4-104.`)
  }
  return c
}

export function siglaCurso(valor, campo = 'curso') {
  const s = textoDe(obrigatorio(valor, campo), campo).toUpperCase()
  if (!REGEX_SIGLA_CURSO.test(s)) {
    throw new ErroValidacao(`"${campo}" deve ser a sigla do curso (2 a 20 letras ou números), ex.: SI.`)
  }
  return s
}

export const busca = (valor, campo = 'busca') => texto(valor, campo, { max: TAMANHO_MAXIMO_BUSCA })
