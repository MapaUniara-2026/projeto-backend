import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Configuração usada pela CLI do Prisma (migrate, studio, seed).
// Migrações usam DIRECT_URL (Supabase "Session pooler", porta 5432).
// A aplicação em execução usa DATABASE_URL (Supabase "Transaction pooler", porta 6543) — ver src/lib/prisma.js.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',
  },
  datasource: {
    // Fallback vazio para que `prisma generate` funcione sem banco (ex.: no CI).
    url: process.env.DIRECT_URL ?? '',
  },
})
