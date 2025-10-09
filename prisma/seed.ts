import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Hash the password
  const hashedPassword = await bcrypt.hash('password', 10)

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@user.com' },
    update: {},
    create: {
      email: 'demo@user.com',
      password: hashedPassword,
      name: 'Demo User',
    },
  })

  console.log('Created user:', user)

  // Create some sample posts
  const posts = await Promise.all([
    prisma.post.upsert({
      where: { id: 1 },
      update: {},
      create: {
        title: 'Getting Started with TanStack',
        body: 'TanStack provides powerful tools for building modern web applications with React, including Router and Query.',
        published: true,
        authorId: user.id,
      },
    }),
    prisma.post.upsert({
      where: { id: 2 },
      update: {},
      create: {
        title: 'Building Fullstack Apps with Prisma',
        body: 'Prisma is a next-generation ORM that makes database access easy and type-safe.',
        published: true,
        authorId: user.id,
      },
    }),
    prisma.post.upsert({
      where: { id: 3 },
      update: {},
      create: {
        title: 'TypeScript Best Practices',
        body: 'Learn how to write better TypeScript code with these proven patterns and practices.',
        published: true,
        authorId: user.id,
      },
    }),
  ])

  console.log('Created posts:', posts)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
