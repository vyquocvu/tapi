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

  // Create a sample category
  const category = await prisma.category.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Technology',
      slug: 'technology',
      description: 'Articles about technology and software development',
    },
  })

  console.log('Created category:', category)

  // Create some sample articles
  const articles = await Promise.all([
    prisma.article.upsert({
      where: { id: 1 },
      update: {},
      create: {
        title: 'Getting Started with TanStack',
        slug: 'getting-started-with-tanstack',
        content: 'TanStack provides powerful tools for building modern web applications with React, including Router and Query.',
        excerpt: 'Learn about TanStack tools',
        published: true,
        status: 'published',
        authorId: user.id,
        categoryId: category.id,
      },
    }),
    prisma.article.upsert({
      where: { id: 2 },
      update: {},
      create: {
        title: 'Building Fullstack Apps with Prisma',
        slug: 'building-fullstack-apps-with-prisma',
        content: 'Prisma is a next-generation ORM that makes database access easy and type-safe.',
        excerpt: 'Learn about Prisma ORM',
        published: true,
        status: 'published',
        authorId: user.id,
        categoryId: category.id,
      },
    }),
    prisma.article.upsert({
      where: { id: 3 },
      update: {},
      create: {
        title: 'TypeScript Best Practices',
        slug: 'typescript-best-practices',
        content: 'Learn how to write better TypeScript code with these proven patterns and practices.',
        excerpt: 'TypeScript tips and tricks',
        published: false,
        status: 'draft',
        authorId: user.id,
        categoryId: category.id,
      },
    }),
  ])

  console.log('Created articles:', articles)
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
