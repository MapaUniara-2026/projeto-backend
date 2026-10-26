// Padroniza TODOS os erros da API no formato { erro, codigo } (contrato, seção 2.6).
// Também converte erros do Prisma/PostgreSQL em respostas HTTP claras: é aqui que as
// regras de integridade do banco (RNF11) viram mensagens para o front.
//
// Status usados: 400 parâmetro inválido | 404 não encontrado | 409 conflito |
//                500 erro inesperado    | 503 banco indisponível

export class ErroApi extends Error {
  constructor(status, codigo, mensagem) {
    super(mensagem)
    this.status = status
    this.codigo = codigo
  }
}

// Mantido com o mesmo nome para não quebrar as rotas que já usam ErroValidacao(mensagem).
export class ErroValidacao extends ErroApi {
  constructor(mensagem) {
    super(400, 'PARAMETRO_INVALIDO', mensagem)
  }
}

export const naoEncontrado = (mensagem) => new ErroApi(404, 'NAO_ENCONTRADO', mensagem)
export const conflito = (mensagem, codigo = 'CONFLITO') => new ErroApi(409, codigo, mensagem)

const ERROS_PRISMA = {
  P2002: [409, 'CONFLITO', 'Já existe um registro com esses dados (valor duplicado).'],
  P2003: [409, 'CONFLITO', 'Operação viola a integridade: o registro relacionado não existe ou ainda está em uso.'],
  P2025: [404, 'NAO_ENCONTRADO', 'Registro não encontrado.'],
}

// Banco fora do ar, sem conexão ou sem conexões livres no pooler.
const CODIGOS_BANCO_INDISPONIVEL = new Set([
  'P1001', // não alcança o servidor
  'P1002', // timeout ao alcançar o servidor
  'P1008', // timeout de operação
  'P1017', // servidor fechou a conexão
  'P2024', // timeout ao obter conexão do pool
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  '57P01', // PostgreSQL: desligamento administrativo
  '53300', // PostgreSQL: conexões demais
  '08001',
  '08006',
])

function bancoIndisponivel(err) {
  if (err?.name === 'PrismaClientInitializationError') return true
  // O erro do driver pode vir direto ou aninhado em "cause" (ou dentro dele de novo).
  for (let atual = err, i = 0; atual && i < 4; atual = atual.cause, i++) {
    if (CODIGOS_BANCO_INDISPONIVEL.has(atual.code)) return true
  }
  return false
}

export function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: 'Rota não encontrada.', codigo: 'NAO_ENCONTRADO' })
}

// eslint-disable-next-line no-unused-vars
export function tratarErros(err, req, res, next) {
  // Erros que a própria API lançou de propósito (validação, conflito de horário etc.).
  if (err instanceof ErroApi) {
    return res.status(err.status).json({ erro: err.message, codigo: err.codigo })
  }

  // Corpo da requisição ilegível (JSON malformado, grande demais...). Vem do express.json().
  if (typeof err?.type === 'string' && err.type.startsWith('entity.')) {
    return res.status(400).json({ erro: 'Corpo da requisição inválido (JSON malformado ou grande demais).', codigo: 'PARAMETRO_INVALIDO' })
  }

  // Erros conhecidos do Prisma (integridade do banco).
  const mapeado = ERROS_PRISMA[err?.code]
  if (mapeado) {
    const [status, codigo, erro] = mapeado
    return res.status(status).json({ erro, codigo, campos: err.meta?.target })
  }

  // O Prisma recusou os dados enviados (tipo errado, campo faltando). É culpa de quem chamou.
  if (err?.name === 'PrismaClientValidationError') {
    return res.status(400).json({ erro: 'Parâmetros inválidos.', codigo: 'PARAMETRO_INVALIDO' })
  }

  // RF16: o front mostra "tentar novamente", então o banco fora do ar precisa de um 503 próprio.
  if (bancoIndisponivel(err)) {
    console.error('Banco indisponível:', err.code ?? err.name, err.message)
    return res.status(503).json({ erro: 'Banco de dados indisponível. Tente novamente em instantes.', codigo: 'BANCO_INDISPONIVEL' })
  }

  // Qualquer outra coisa: loga aqui e não expõe detalhes internos ao cliente.
  console.error(err)
  return res.status(500).json({ erro: 'Erro inesperado. Tente novamente.', codigo: 'ERRO_INTERNO' })
}
