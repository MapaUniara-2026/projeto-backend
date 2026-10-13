// Converte erros do Prisma/PostgreSQL em respostas HTTP claras.
// É aqui que as regras de integridade do banco (RNF11) viram mensagens para o front.
const ERROS_PRISMA = {
  P2002: [409, 'Já existe um registro com esses dados (valor duplicado).'],
  P2003: [409, 'Operação viola a integridade: o registro relacionado não existe ou ainda está em uso.'],
  P2025: [404, 'Registro não encontrado.'],
}

// eslint-disable-next-line no-unused-vars
export function tratarErros(err, req, res, next) {
  const mapeado = ERROS_PRISMA[err.code]
  if (mapeado) {
    const [status, erro] = mapeado
    return res.status(status).json({ erro, codigo: err.code, campos: err.meta?.target })
  }
  if (err.status) {
    return res.status(err.status).json({ erro: err.message })
  }
  console.error(err)
  return res.status(500).json({ erro: 'Erro interno do servidor' })
}

export class ErroValidacao extends Error {
  constructor(mensagem) {
    super(mensagem)
    this.status = 400
  }
}
