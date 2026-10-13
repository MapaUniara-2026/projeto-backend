import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// DATABASE_URL = Supabase "Transaction pooler" (porta 6543), ideal para serverless (Vercel).
// Se a URL tiver ?schema=dev (ou qa), as queries usam esse schema do PostgreSQL.
// Isso permite que DEV e QA dividam o mesmo projeto gratuito do Supabase.
function criarCliente() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não definida. Copie .env.example para .env e preencha.')
  }
  const url = new URL(process.env.DATABASE_URL)
  const schema = url.searchParams.get('schema') ?? undefined
  url.searchParams.delete('schema')

  const adapter = new PrismaPg({ connectionString: url.toString() }, { schema })
  return new PrismaClient({ adapter })
}

// Reaproveita a mesma instância entre reloads locais e invocações na Vercel.
const globalParaPrisma = globalThis
export const prisma = globalParaPrisma.__prisma ?? criarCliente()
globalParaPrisma.__prisma = prisma
