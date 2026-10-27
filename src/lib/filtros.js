// Leitura segura dos filtros da query string (?dia=SEGUNDA&curso=SI...).
// Todo filtro é opcional: ausente ou vazio vira undefined, e o Prisma ignora.
import { ErroValidacao } from '../middlewares/erros.js'

// RN04: consulta apenas de segunda a sexta-feira.
export const DIAS = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA']

// RN03: o período é definido pela hora de início. "HH:MM" pode ser comparado como texto.
export const PERIODOS = {
  MATUTINO: { lt: '12:00' },
  VESPERTINO: { gte: '12:00', lt: '18:00' },
  NOTURNO: { gte: '18:00' },
}

export const periodoDe = (hora) => (hora < '12:00' ? 'MATUTINO' : hora < '18:00' ? 'VESPERTINO' : 'NOTURNO')

// Códigos aceitos: letras, números, ponto, hífen e _ (ex.: BL4-104, SI6-01, 2026.2).
const CODIGO = /^[A-Za-z0-9._-]{1,20}$/

// Filtro de texto: recusa listas (?x=1&x=2) e caracteres inesperados. Devolve em maiúsculas.
export function filtroCodigo(query, nome) {
  const valor = query[nome]
  if (valor === undefined || valor === '') return undefined
  if (typeof valor !== 'string' || !CODIGO.test(valor.trim())) {
    throw new ErroValidacao(`Filtro "${nome}" inválido.`)
  }
  return valor.trim().toUpperCase()
}

// Filtro por id numérico (ex.: ?professor=3).
export function filtroId(query, nome) {
  const valor = query[nome]
  if (valor === undefined || valor === '') return undefined
  if (typeof valor !== 'string' || !/^\d{1,9}$/.test(valor.trim())) {
    throw new ErroValidacao(`Filtro "${nome}" deve ser um número inteiro.`)
  }
  return Number(valor)
}
