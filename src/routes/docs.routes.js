// Swagger UI em /api/docs. A tela é carregada de CDN (sem dependência no projeto),
// o que também evita a página em branco que o swagger-ui-express costuma dar na Vercel.
import { Router } from 'express'
import { openapi } from '../docs/openapi.js'

const router = Router()
const CDN = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14'

const pagina = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>API do Mapa Interativo — Documentação</title>
  <link rel="stylesheet" href="${CDN}/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${CDN}/swagger-ui-bundle.js"></script>
  <script>SwaggerUIBundle({ url: '/api/docs/openapi.json', dom_id: '#swagger-ui' })</script>
</body>
</html>`

router.get('/', (req, res) => res.type('html').send(pagina))
router.get('/openapi.json', (req, res) => res.json(openapi))

export default router
