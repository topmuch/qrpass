import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Force new PrismaClient to get latest schema changes
// This ensures we have access to all models including Lead
const createPrismaClient = () => {
  return new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  })
}

// Always create fresh client to pick up schema changes
// In production, use cached instance for performance
const db = process.env.NODE_ENV === 'production' 
  ? (globalForPrisma.prisma ?? createPrismaClient())
  : createPrismaClient()

if (process.env.NODE_ENV === 'production') {
  globalForPrisma.prisma = db
}

export { db }

// Export type for TypeScript support
export type { PrismaClient }
