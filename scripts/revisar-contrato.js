// Roda a coleção do Insomnia fora do Insomnia e gera um relatório da revisão do contrato.
//
// Uso:
//   node scripts/revisar-contrato.js                       (ambiente Local)
//   node scripts/revisar-contrato.js --env DEV
//   node scripts/revisar-contrato.js --colecao docs/insomnia-colecao.json --saida docs/relatorio-contrato.md
//
// Gera dois arquivos: o relatório em Markdown e um .json com os mesmos dados.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { expect } from 'chai' // mesma biblioteca de asserções que o Insomnia usa por baixo

// ---------- 1. Argumentos da linha de comando ----------
function arg(nome, padrao) {
  const i = process.argv.indexOf(`--${nome}`)
  return i > -1 ? process.argv[i + 1] : padrao
}
const caminhoColecao = arg('colecao', 'docs/insomnia-colecao.json')
const nomeAmbiente = arg('env', 'Local')
const caminhoSaida = arg('saida', 'docs/relatorio-contrato.md')

// ---------- 2. Lê a coleção exportada do Insomnia ----------
const { resources } = JSON.parse(readFileSync(caminhoColecao, 'utf-8'))
const porTipo = (t) => resources.filter((r) => r._type === t)
const ordenar = (a, b) => (a.metaSortKey ?? 0) - (b.metaSortKey ?? 0)

const workspace = porTipo('workspace')[0]
const ambienteBase = porTipo('environment').find((e) => e.parentId === workspace._id)
const ambiente = porTipo('environment').find((e) => e.name === nomeAmbiente) ?? ambienteBase
const variaveis = { ...ambienteBase.data, ...ambiente.data }

// Troca {{ _.base }} pelo valor do ambiente escolhido
const resolver = (texto) => texto.replace(/\{\{\s*_\.(\w+)\s*\}\}/g, (_, v) => variaveis[v] ?? '')

const pastas = porTipo('request_group').sort(ordenar)
const requestsDa = (pastaId) => porTipo('request').filter((r) => r.parentId === pastaId).sort(ordenar)

// ---------- 3. Executa uma request e as verificações dela ----------
async function executar(req) {
  const url = resolver(req.url)
  const headers = Object.fromEntries((req.headers ?? []).map((h) => [h.name, h.value]))
  const inicio = performance.now()
  let resposta, texto
  try {
    resposta = await fetch(url, { method: req.method, headers, body: req.body?.text })
    texto = await resposta.text()
  } catch (err) {
    return { url, erroRede: err.cause?.code ?? err.message, testes: [] }
  }
  const ms = Math.round(performance.now() - inicio)

  // Objeto "insomnia" mínimo: só o que os scripts da coleção usam
  const testes = []
  const insomnia = {
    expect,
    response: {
      code: resposta.status,
      headers: { get: (n) => resposta.headers.get(n) ?? '' },
      json: () => JSON.parse(texto),
    },
    test(nome, fn) {
      try {
        fn()
        testes.push({ nome, passou: true })
      } catch (err) {
        testes.push({ nome, passou: false, motivo: err.message })
      }
    },
  }
  try {
    new Function('insomnia', req.afterResponseScript ?? '')(insomnia)
  } catch (err) {
    testes.push({ nome: 'script da request', passou: false, motivo: err.message })
  }
  return { url, status: resposta.status, ms, corpo: texto, testes }
}

// ---------- 4. Roda tudo, na ordem das pastas ----------
const resultados = []
for (const pasta of pastas) {
  for (const req of requestsDa(pasta._id)) {
    const r = await executar(req)
    resultados.push({ pasta: pasta.name, nome: req.name, metodo: req.method, descricao: req.description, ...r })
    const ok = r.testes.length > 0 && r.testes.every((t) => t.passou)
    console.log(`${ok ? '✔' : '✘'} [${pasta.name}] ${req.name} → ${r.status ?? r.erroRede}`)
  }
}

// ---------- 5. Monta o relatório em Markdown ----------
const todos = resultados.flatMap((r) => r.testes)
const aprovados = todos.filter((t) => t.passou).length
const requestOk = (r) => !r.erroRede && r.testes.every((t) => t.passou)
const formatarCorpo = (t) => {
  try {
    t = JSON.stringify(JSON.parse(t), null, 2)
  } catch {}
  return t.length > 1500 ? t.slice(0, 1500) + '\n… (cortado)' : t
}
const dataHora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })

let md = `# Relatório da revisão do contrato da API

| | |
|---|---|
| Data | ${dataHora} |
| Ambiente | ${ambiente.name} (\`${variaveis.base}\`) |
| Requests | ${resultados.filter(requestOk).length} de ${resultados.length} sem divergências |
| Verificações | ${aprovados} de ${todos.length} aprovadas |

## Resumo

| | Pasta | Request | Status | Verificações |
|---|---|---|---|---|
${resultados
  .map((r) => {
    const n = r.testes.filter((t) => t.passou).length
    return `| ${requestOk(r) ? '✅' : '❌'} | ${r.pasta} | ${r.nome} | ${r.status ?? r.erroRede} | ${n}/${r.testes.length} |`
  })
  .join('\n')}
`

let pastaAtual
for (const r of resultados) {
  if (r.pasta !== pastaAtual) md += `\n## ${(pastaAtual = r.pasta)}\n`
  md += `\n### ${requestOk(r) ? '✅' : '❌'} ${r.nome}\n\n`
  md += `\`${r.metodo} ${r.url}\`${r.status ? ` → **${r.status}** em ${r.ms} ms` : ''}\n\n`
  if (r.descricao) md += `**O que o contrato espera:** ${r.descricao.replace(/\n+/g, ' ')}\n\n`
  if (r.erroRede) {
    md += `> ⚠ Não foi possível conectar: \`${r.erroRede}\`. A API está no ar?\n`
    continue
  }
  md += r.testes.map((t) => `- ${t.passou ? '✅' : '❌'} ${t.nome}${t.passou ? '' : ` — \`${t.motivo}\``}`).join('\n')
  md += `\n\n<details><summary>Resposta recebida</summary>\n\n\`\`\`json\n${formatarCorpo(r.corpo)}\n\`\`\`\n\n</details>\n`
}

// ---------- 6. Grava os arquivos ----------
mkdirSync(dirname(caminhoSaida), { recursive: true })
writeFileSync(caminhoSaida, md)
writeFileSync(caminhoSaida.replace(/\.md$/, '.json'), JSON.stringify({ dataHora, ambiente: ambiente.name, resultados }, null, 2))
console.log(`\n${aprovados}/${todos.length} verificações aprovadas. Relatório: ${caminhoSaida}`)
