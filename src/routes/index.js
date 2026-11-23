// Ponto único de montagem das rotas da API: tudo fica sob /api.
// Uma entidade = um arquivo src/routes/<entidade>.routes.js, montado aqui.
//
// Regras:
//  - O contrato com o front-end é somente leitura (RNF08): as rotas expostas são GET.
//  - Dentro de um router, rotas FIXAS vêm antes das com parâmetro
//    (ex.: /salas/ocupacao antes de /salas/:codigo), senão "ocupacao" vira um código de sala.
//  - Ao criar ou alterar uma rota, atualize docs/API.md no mesmo PR (contrato, seção 3.2).
import { Router } from 'express'
import aulasRoutes from './aulas.routes.js'
import cursosRoutes from './cursos.routes.js'
import docsRoutes from './docs.routes.js'
import healthRoutes from './health.routes.js'
import horariosRoutes from './horarios.routes.js'
import professoresRoutes from './professores.routes.js'
import salasRoutes from './salas.routes.js'
import turmasRoutes from './turmas.routes.js'

const router = Router()

router.use('/health', healthRoutes)           // GET /api/health
router.use('/cursos', cursosRoutes)           // GET /api/cursos e /api/cursos/:id
router.use('/salas', salasRoutes)             // GET /api/salas, /api/salas/ocupacao e /api/salas/:codigo
router.use('/aulas', aulasRoutes)             // GET /api/aulas e /api/aulas/:id
router.use('/horarios', horariosRoutes)       // GET /api/horarios e /api/horarios/:id
router.use('/turmas', turmasRoutes)           // GET /api/turmas
router.use('/professores', professoresRoutes) // GET /api/professores
router.use('/docs', docsRoutes)               // Swagger UI em /api/docs

export default router
