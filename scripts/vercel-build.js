// Build do back-end na Vercel.
// - Sempre gera o Prisma Client.
// - Aplica as migrações SOMENTE nos deploys das branches de ambiente (dev, qa, main).
//   Previews de feature/* NÃO mexem no banco compartilhado.
// A migração roda antes do deploy ficar no ar; se falhar, o deploy falha e a versão anterior continua.
import { execSync } from 'node:child_process'

const BRANCHES_DE_AMBIENTE = ['dev', 'qa', 'main']
const branch = process.env.VERCEL_GIT_COMMIT_REF ?? ''

function rodar(comando) {
  console.log(`> ${comando}`)
  execSync(comando, { stdio: 'inherit' })
}

rodar('npx prisma generate')

if (BRANCHES_DE_AMBIENTE.includes(branch)) {
  console.log(`Branch "${branch}": aplicando migrações no banco do ambiente.`)
  rodar('npx prisma migrate deploy')
} else {
  console.log(`Branch "${branch || 'local'}": migrações não aplicadas (apenas branches dev, qa e main migram).`)
}
