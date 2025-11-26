import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '@prisma/client'
import BetterSqlite3 from 'better-sqlite3'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function checkDatabaseMigrations() {
  console.log('Checking database migrations...')

  try {
    const sqlite = new BetterSqlite3(
      process.env.DATABASE_URL || 'file:./dev.db'
    )
    const adapter = new PrismaBetterSqlite3(sqlite)
    const prisma = new PrismaClient({ adapter })

    await prisma.$connect()
    console.log('Database connection successful.')
    await prisma.$disconnect()

    const { stdout: migrationStatus } = await execAsync(
      'npm run prisma -- migrate status'
    )

    if (migrationStatus.includes('No pending migrations to apply.')) {
      console.log('Database is up to date. No migrations needed.')
      return true
    } else {
      console.log('Database migrations are pending.')
      return false
    }
  } catch (error) {
    console.error('Migration check failed:', error.message)

    if (
      error.message.includes(
        'connect ECONNREFUSED' ||
          error.message.includes('server does not exist') ||
          error.message.includes('already exists')
      )
    ) {
      console.log(
        'Database connection failed. Assuming migrations are needed.'
      )
      return false
    }

    if (
      error.message.includes('PrismaClient is unable to run') ||
      error.message.includes('prisma generate')
    ) {
      console.log(
        'Prisma Client not generated. Running `prisma generate`...'
      )
      await execAsync('npm run prisma -- generate')
      console.log('Retrying migration check...')
      return checkDatabaseMigrations()
    }
    return false
  }
}

checkDatabaseMigrations().then((isMigrated) => {
  if (isMigrated) {
    process.exit(0)
  } else {
    process.exit(1)
  }
})
