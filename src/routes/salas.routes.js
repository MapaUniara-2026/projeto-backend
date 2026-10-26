// Rotas de salas (contrato 2.2, 2.3 e 2.4). Só leitura (RNF08).
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { ErroValidacao } from '../middlewares/erros.js'
import { DIAS, agoraEmSaoPaulo, paraTime, validarOpcao } from '../lib/horarios.js'
import { SELECT_AULA, formatarAula } from './aulas.routes.js'

const router = Router()

// Campos que o front recebe. id, criadoEm e atualizadoEm ficam de fora (contrato 2.3).
const CAMPOS_SALA = {
  codigo: true,
  nome: true,
  bloco: true,
  andar: true,
  tipo: true,
  localizacaoMapa: true,
}

// GET /api/salas?andar=1&tipo=LABORATORIO&busca=104
// Lista para o mapa e a busca, SEM fotografias (RNF04). Filtros opcionais e combináveis.
router.get('/', async (req, res) => {
  const { andar, tipo, busca } = req.query
  const where = {}

  if (andar !== undefined) {
    if (!/^-?\d+$/.test(String(andar))) {
      throw new ErroValidacao('O filtro "andar" deve ser um número inteiro.')
    }
    where.andar = Number(andar)
  }

  if (tipo) {
    where.tipo = String(tipo).toUpperCase()
  }

  if (busca && String(busca).trim()) {
    const texto = String(busca).trim()
    // Procura no nome OU no código, sem diferenciar maiúsculas de minúsculas.
    where.OR = [
      { nome: { contains: texto, mode: 'insensitive' } },
      { codigo: { contains: texto, mode: 'insensitive' } },
    ]
  }

  const salas = await prisma.sala.findMany({
    where,
    select: CAMPOS_SALA,
    orderBy: { codigo: 'asc' },
  })
  res.json(salas)
})

// GET /api/salas/ocupacao?dia=SEGUNDA&hora=19:30   (sem parâmetros: agora, no horário de São Paulo)
// Precisa vir ANTES de /:codigo; senão o Express trata "ocupacao" como código de sala.
router.get('/ocupacao', async (req, res) => {
  let { dia, hora } = req.query

  if ((dia === undefined) !== (hora === undefined)) {
    throw new ErroValidacao('Informe "dia" e "hora" juntos, ou nenhum dos dois para usar o momento atual.')
  }
  if (dia === undefined) {
    ;({ dia, hora } = agoraEmSaoPaulo())
  } else {
    dia = validarOpcao(dia, DIAS, 'dia')
  }
  const instante = paraTime(hora)

  // Aulas acontecendo no instante: começou até a hora pedida e ainda não terminou.
  // Fim de semana (dia null) não tem aula: todas as salas ficam livres.
  const aulas = dia
    ? await prisma.aula.findMany({
        where: { diaSemana: dia, horaInicio: { lte: instante }, horaTermino: { gt: instante } },
        select: SELECT_AULA,
      })
    : []

  const salas = await prisma.sala.findMany({ select: CAMPOS_SALA, orderBy: { codigo: 'asc' } })
  const aulaPorSala = new Map(aulas.map((a) => [a.sala.codigo, a]))

  res.json(
    salas.map((sala) => {
      const aula = aulaPorSala.get(sala.codigo)
      return { ...sala, ocupada: Boolean(aula), aula: aula ? formatarAula(aula) : null }
    }),
  )
})

// GET /api/salas/BL4-104
// Detalhe da sala pelo código (2.2), com as fotos (2.4). Sem fotos -> fotos: [].
router.get('/:codigo', async (req, res) => {
  // findUniqueOrThrow: se não achar, o Prisma lança P2025 e o middleware de erros responde 404.
  const sala = await prisma.sala.findUniqueOrThrow({
    where: { codigo: req.params.codigo.toUpperCase() },
    select: {
      ...CAMPOS_SALA,
      imagens: { select: { url: true, descricao: true }, orderBy: { id: 'asc' } },
    },
  })

  // No banco a relação se chama "imagens"; o contrato chama de "fotos".
  const { imagens, ...dados } = sala
  res.json({ ...dados, fotos: imagens })
})

export default router
