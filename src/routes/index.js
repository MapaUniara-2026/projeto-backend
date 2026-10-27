// Ponto único de montagem das rotas da API: tudo fica sob /api.
// Uma entidade = um arquivo src/routes/<entidade>.routes.js, montado aqui.
//
// Regras:
//  - O contrato com o front-end é somente leitura (RNF08): as rotas expostas são GET.
//  - Dentro de um router, rotas FIXAS vêm antes das com parâmetro
//    (ex.: /salas/ocupacao antes de /salas/:codigo), senão "ocupacao" vira um código de sala.
//  - Ao criar ou alterar uma rota, atualize docs/API.md no mesmo PR (contrato, seção 3.2).
import { Router } from 'express'
import cursosRoutes from './cursos.routes.js'
import healthRoutes from './health.routes.js'
import salasRoutes from './salas.routes.js'

const router = Router()

router.use('/health', healthRoutes) // GET /api/health
router.use('/cursos', cursosRoutes) // GET /api/cursos
router.use('/salas', salasRoutes) //   GET /api/salas (+ /ocupacao e /:codigo, ver contrato)

export default router
