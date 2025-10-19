import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')
  
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
      bio: 'A demo user for testing the CMS features',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
    },
  })

  console.log('✅ Created user:', user.name)

  // Create a sample category
  const techCategory = await prisma.category.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Technology',
      slug: 'technology',
      description: 'Articles about technology and software development',
    },
  })

  console.log('✅ Created category:', techCategory.name)

  const tutorialsCategory = await prisma.category.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Tutorials',
      slug: 'tutorials',
      description: 'Step-by-step tutorials and guides',
    },
  })

  console.log('✅ Created category:', tutorialsCategory.name)

  // Create some sample articles
  const article1 = await prisma.article.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'Getting Started with TanStack',
      slug: 'getting-started-with-tanstack',
      content: 'TanStack provides powerful tools for building modern web applications with React, including Router and Query. In this comprehensive guide, we will explore how to set up TanStack Router with type-safe routing and TanStack Query for efficient data fetching.',
      excerpt: 'Learn about TanStack tools and how to use them effectively',
      published: true,
      status: 'published',
      publishedAt: new Date('2024-01-15'),
      viewCount: 1250,
      authorId: user.id,
      categoryId: techCategory.id,
    },
  })

  const article2 = await prisma.article.upsert({
    where: { id: 2 },
    update: {},
    create: {
      title: 'Building Fullstack Apps with Prisma',
      slug: 'building-fullstack-apps-with-prisma',
      content: 'Prisma is a next-generation ORM that makes database access easy and type-safe. This article covers the fundamentals of Prisma, from schema design to migrations, and shows you how to integrate it into your fullstack application.',
      excerpt: 'Learn about Prisma ORM and database management',
      published: true,
      status: 'published',
      publishedAt: new Date('2024-02-01'),
      viewCount: 890,
      authorId: user.id,
      categoryId: tutorialsCategory.id,
    },
  })

  const article3 = await prisma.article.upsert({
    where: { id: 3 },
    update: {},
    create: {
      title: 'TypeScript Best Practices',
      slug: 'typescript-best-practices',
      content: 'Learn how to write better TypeScript code with these proven patterns and practices. We cover type safety, generics, utility types, and advanced TypeScript features that will make your code more maintainable and robust.',
      excerpt: 'TypeScript tips and tricks for better code',
      published: false,
      status: 'draft',
      authorId: user.id,
      categoryId: techCategory.id,
    },
  })

  console.log('✅ Created articles:', [article1.title, article2.title, article3.title].join(', '))

  // Create CMS Tags
  const featuredTag = await prisma.contentTag.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Featured',
      slug: 'featured',
      description: 'Featured content highlighted on the homepage',
      color: '#FF5733',
    },
  })

  const beginnerTag = await prisma.contentTag.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Beginner Friendly',
      slug: 'beginner-friendly',
      description: 'Content suitable for beginners',
      color: '#33C3FF',
    },
  })

  const advancedTag = await prisma.contentTag.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'Advanced',
      slug: 'advanced',
      description: 'Advanced topics for experienced developers',
      color: '#9B59B6',
    },
  })

  console.log('✅ Created tags:', [featuredTag.name, beginnerTag.name, advancedTag.name].join(', '))

  // Tag articles
  await prisma.contentTagRelation.upsert({
    where: { id: 1 },
    update: {},
    create: {
      tagId: featuredTag.id,
      contentType: 'api::article.article',
      contentId: article1.id,
    },
  })

  await prisma.contentTagRelation.upsert({
    where: { id: 2 },
    update: {},
    create: {
      tagId: beginnerTag.id,
      contentType: 'api::article.article',
      contentId: article1.id,
    },
  })

  await prisma.contentTagRelation.upsert({
    where: { id: 3 },
    update: {},
    create: {
      tagId: featuredTag.id,
      contentType: 'api::article.article',
      contentId: article2.id,
    },
  })

  await prisma.contentTagRelation.upsert({
    where: { id: 4 },
    update: {},
    create: {
      tagId: advancedTag.id,
      contentType: 'api::article.article',
      contentId: article3.id,
    },
  })

  console.log('✅ Tagged articles with CMS tags')

  // Add SEO metadata for published articles
  await prisma.contentMetadata.upsert({
    where: { 
      contentType_contentId: {
        contentType: 'api::article.article',
        contentId: article1.id,
      }
    },
    update: {},
    create: {
      contentType: 'api::article.article',
      contentId: article1.id,
      metaTitle: 'Getting Started with TanStack - A Complete Guide',
      metaDescription: 'Learn how to use TanStack Router and Query to build modern React applications with type-safe routing and efficient data fetching.',
      metaKeywords: 'tanstack, react, router, query, typescript, tutorial',
      ogTitle: 'Getting Started with TanStack',
      ogDescription: 'Master TanStack tools for modern React development',
      ogImage: 'https://example.com/images/tanstack-tutorial.jpg',
      createdById: user.id,
      customData: {
        readingTime: '8 min',
        difficulty: 'beginner',
        featured: true,
      },
    },
  })

  await prisma.contentMetadata.upsert({
    where: { 
      contentType_contentId: {
        contentType: 'api::article.article',
        contentId: article2.id,
      }
    },
    update: {},
    create: {
      contentType: 'api::article.article',
      contentId: article2.id,
      metaTitle: 'Building Fullstack Apps with Prisma ORM',
      metaDescription: 'A comprehensive guide to using Prisma ORM for type-safe database access in fullstack applications.',
      metaKeywords: 'prisma, orm, database, postgresql, typescript, fullstack',
      ogTitle: 'Fullstack Development with Prisma',
      ogDescription: 'Learn Prisma ORM for modern database management',
      ogImage: 'https://example.com/images/prisma-guide.jpg',
      createdById: user.id,
      customData: {
        readingTime: '12 min',
        difficulty: 'intermediate',
        featured: true,
      },
    },
  })

  console.log('✅ Added SEO metadata for articles')

  // Create content revisions (audit trail)
  await prisma.contentRevision.upsert({
    where: { 
      contentType_contentId_revisionNumber: {
        contentType: 'api::article.article',
        contentId: article1.id,
        revisionNumber: 1,
      }
    },
    update: {},
    create: {
      contentType: 'api::article.article',
      contentId: article1.id,
      revisionNumber: 1,
      data: {
        title: article1.title,
        content: article1.content,
        status: article1.status,
      },
      changeLog: 'Initial version',
      createdById: user.id,
    },
  })

  await prisma.contentRevision.upsert({
    where: { 
      contentType_contentId_revisionNumber: {
        contentType: 'api::article.article',
        contentId: article1.id,
        revisionNumber: 2,
      }
    },
    update: {},
    create: {
      contentType: 'api::article.article',
      contentId: article1.id,
      revisionNumber: 2,
      data: {
        title: article1.title,
        content: article1.content,
        status: article1.status,
      },
      changeLog: 'Added more details and examples',
      createdById: user.id,
    },
  })

  console.log('✅ Created content revisions for audit trail')

  // Create content relations (related articles)
  await prisma.contentRelation.upsert({
    where: { 
      sourceType_sourceId_targetType_targetId_relationType: {
        sourceType: 'api::article.article',
        sourceId: article1.id,
        targetType: 'api::article.article',
        targetId: article2.id,
        relationType: 'related',
      }
    },
    update: {},
    create: {
      sourceType: 'api::article.article',
      sourceId: article1.id,
      targetType: 'api::article.article',
      targetId: article2.id,
      relationType: 'related',
    },
  })

  await prisma.contentRelation.upsert({
    where: { 
      sourceType_sourceId_targetType_targetId_relationType: {
        sourceType: 'api::article.article',
        sourceId: article2.id,
        targetType: 'api::article.article',
        targetId: article3.id,
        relationType: 'related',
      }
    },
    update: {},
    create: {
      sourceType: 'api::article.article',
      sourceId: article2.id,
      targetType: 'api::article.article',
      targetId: article3.id,
      relationType: 'related',
    },
  })

  console.log('✅ Created content relations between articles')

  console.log('\n🎉 Database seeded successfully!')
  console.log('\nSummary:')
  console.log('  - 1 user created')
  console.log('  - 2 categories created')
  console.log('  - 3 articles created')
  console.log('  - 3 tags created')
  console.log('  - 4 tag relations created')
  console.log('  - 2 metadata records created')
  console.log('  - 2 content revisions created')
  console.log('  - 2 content relations created')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
