// Padrão de erro da API: toda resposta de erro é { "erro": "mensagem", "codigo": "..." }.
// O "codigo" vem SEMPRE desta lista fixa — o front decide o que fazer olhando para ele,
// e a "mensagem" pode ser mostrada direto ao usuário.
export const CODIGOS = {
  PARAMETRO_INVALIDO: 400,
  NAO_ENCONTRADO: 404,
  ROTA_NAO_ENCONTRADA: 404,
  CONFLITO: 409,
  ERRO_INTERNO: 500,
  BANCO_INDISPONIVEL: 503,
}

export class ErroApi extends Error {
  constructor(codigo, mensagem) {
    super(mensagem)
    this.codigo = codigo
    this.status = CODIGOS[codigo]
  }
}

export class ErroValidacao extends ErroApi {
  constructor(mensagem) {
    super('PARAMETRO_INVALIDO', mensagem)
  }
}

export class ErroNaoEncontrado extends ErroApi {
  constructor(mensagem = 'Registro não encontrado.') {
    super('NAO_ENCONTRADO', mensagem)
  }
}

// Erros do Prisma/PostgreSQL que viram respostas claras para o front (RNF11).
// O código do Prisma (P2002...) fica só no log: o front nunca depende dele.
const ERROS_PRISMA = {
  P2002: ['CONFLITO', 'Já existe um registro com esses dados (valor duplicado).'],
  P2003: ['CONFLITO', 'Operação viola a integridade: o registro relacionado não existe ou ainda está em uso.'],
  P2025: ['NAO_ENCONTRADO', 'Registro não encontrado.'],
}

// Falhas para falar com o banco (fora do ar, pausado no Supabase, senha errada, pool cheio).
// P1xxx = erros de conexão do Prisma; "kind" vem do driver adapter (o $queryRaw embrulha tudo em P2010).
const FALHAS_DE_CONEXAO = new Set([
  'DatabaseNotReachable',
  'DatabaseDoesNotExist',
  'DatabaseAccessDenied',
  'AuthenticationFailed',
  'ConnectionClosed',
  'TooManyConnections',
  'SocketTimeout',
  'TlsConnectionError',
])
const CODIGOS_DE_REDE = new Set(['ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN'])
// Conexão do pool que cai no meio da consulta (banco desligado): o pg lança um Error sem code.
const CONEXAO_ENCERRADA = /^Connection terminated/

function bancoIndisponivel(err) {
  return (
    err.name === 'PrismaClientInitializationError' ||
    /^P1\d{3}$/.test(err.code ?? '') ||
    FALHAS_DE_CONEXAO.has(err.meta?.driverAdapterError?.cause?.kind) ||
    CODIGOS_DE_REDE.has(err.code) ||
    CONEXAO_ENCERRADA.test(err.message ?? '')
  )
}

// Erros do express.json() (corpo da requisição), identificados por err.type.
const ERROS_CORPO = {
  'entity.parse.failed': 'O corpo da requisição não é um JSON válido.',
  'entity.too.large': 'O corpo da requisição é grande demais.',
}

function converter(err) {
  if (err instanceof ErroApi) return [err.codigo, err.message]
  if (ERROS_PRISMA[err.code]) return ERROS_PRISMA[err.code]
  if (bancoIndisponivel(err)) {
    return ['BANCO_INDISPONIVEL', 'O banco de dados está indisponível no momento. Tente novamente em instantes.']
  }
  if (err.type && err.status >= 400 && err.status < 500) {
    return ['PARAMETRO_INVALIDO', ERROS_CORPO[err.type] ?? 'O corpo da requisição é inválido.']
  }
  return ['ERRO_INTERNO', 'Erro interno do servidor.']
}

export function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: `Rota não encontrada: ${req.method} ${req.path}`, codigo: 'ROTA_NAO_ENCONTRADA' })
}

// eslint-disable-next-line no-unused-vars
export function tratarErros(err, req, res, next) {
  const [codigo, erro] = converter(err)
  if (codigo === 'ERRO_INTERNO' || codigo === 'BANCO_INDISPONIVEL') {
    console.error(`[${codigo}] ${req.method} ${req.originalUrl}`, err)
  }
  res.status(CODIGOS[codigo]).json({ erro, codigo })
}
