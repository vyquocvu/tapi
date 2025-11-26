import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import BetterSqlite3 from 'better-sqlite3'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const sqlite = new BetterSqlite3(process.env.DATABASE_URL || 'file:./dev.db')
const adapter = new PrismaBetterSqlite3(sqlite)

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
