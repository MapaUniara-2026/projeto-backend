// Sobe a API numa porta livre para os testes de ponta a ponta.
export async function subirApi() {
  const { default: app } = await import('../src/app.js')
  const servidor = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s))
  })
  const base = `http://127.0.0.1:${servidor.address().port}`
  return {
    async pedir(caminho, opcoes = {}) {
      const resposta = await fetch(`${base}${caminho}`, opcoes)
      const texto = await resposta.text()
      return [resposta.status, texto ? JSON.parse(texto) : null]
    },
    fechar: () => new Promise((resolve) => servidor.close(resolve)),
  }
}
