// Consulta de aulas filtradas por curso, bloco e sala, combinados (RF04, RF11, RF14, RN02).
//
// GET /api/aulas?curso=SI&bloco=BL4&sala=BL4-101
//   Cada filtro aceita vários valores (?curso=SI&curso=EC ou ?curso=SI,EC). Sem filtros devolve todas as aulas.
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { ORDEM, SELECAO, paraAula } from '../lib/aulas-dto.js'
import { lerFiltros, montarWhere } from '../lib/filtros.js'

const router = Router()

// Teto de segurança: uma resposta sem limite pode estourar tempo/memória da função serverless.
// Se passar disso, a resposta vem marcada com `truncado: true` e o front pede para refinar os filtros.
export const LIMITE_AULAS = 5000

router.get('/', async (req, res) => {
  const filtros = lerFiltros(req.query)

  // UMA consulta: o filtro roda no PostgreSQL e as relações vêm por JOIN. Sem `relationLoadStrategy: 'join'`
  // o Prisma 7.10 dispara 1 query por relação (5 idas ao banco, em 3 níveis sequenciais).
  // `take: LIMITE + 1` permite saber se passou do teto sem rodar um COUNT à parte.
  const horarios = await prisma.horario.findMany({
    where: montarWhere(filtros),
    select: SELECAO,
    orderBy: ORDEM,
    take: LIMITE_AULAS + 1,
    relationLoadStrategy: 'join', // exige previewFeatures = ["relationJoins"] no schema.prisma
  })

  const truncado = horarios.length > LIMITE_AULAS
  const aulas = (truncado ? horarios.slice(0, LIMITE_AULAS) : horarios).map(paraAula)

  // Cache curto no CDN da Vercel; o navegador sempre revalida (ETag automático do Express -> 304).
  res.set('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=60')
  res.json({ total: aulas.length, truncado, filtros, aulas })
})

export default router
