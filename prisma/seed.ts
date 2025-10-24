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

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Admin',
      description: 'Full system access with all permissions',
    },
  })

  const editorRole = await prisma.role.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Editor',
      description: 'Can create and edit content',
    },
  })

  const viewerRole = await prisma.role.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'Viewer',
      description: 'Can only view content',
    },
  })

  console.log('✅ Created roles:', [adminRole.name, editorRole.name, viewerRole.name].join(', '))

  // Create permissions
  const permissions = [
    // User management
    { name: 'users:create', resource: 'users', action: 'create', description: 'Create new users' },
    { name: 'users:read', resource: 'users', action: 'read', description: 'View users' },
    { name: 'users:update', resource: 'users', action: 'update', description: 'Update users' },
    { name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users' },
    { name: 'users:manage', resource: 'users', action: 'manage', description: 'Full user management' },
    
    // Role management
    { name: 'roles:create', resource: 'roles', action: 'create', description: 'Create new roles' },
    { name: 'roles:read', resource: 'roles', action: 'read', description: 'View roles' },
    { name: 'roles:update', resource: 'roles', action: 'update', description: 'Update roles' },
    { name: 'roles:delete', resource: 'roles', action: 'delete', description: 'Delete roles' },
    { name: 'roles:manage', resource: 'roles', action: 'manage', description: 'Full role management' },
    
    // Permission management
    { name: 'permissions:create', resource: 'permissions', action: 'create', description: 'Create new permissions' },
    { name: 'permissions:read', resource: 'permissions', action: 'read', description: 'View permissions' },
    { name: 'permissions:update', resource: 'permissions', action: 'update', description: 'Update permissions' },
    { name: 'permissions:delete', resource: 'permissions', action: 'delete', description: 'Delete permissions' },
    { name: 'permissions:manage', resource: 'permissions', action: 'manage', description: 'Full permission management' },
    
    // Content management
    { name: 'content:create', resource: 'content', action: 'create', description: 'Create content' },
    { name: 'content:read', resource: 'content', action: 'read', description: 'View content' },
    { name: 'content:update', resource: 'content', action: 'update', description: 'Update content' },
    { name: 'content:delete', resource: 'content', action: 'delete', description: 'Delete content' },
    { name: 'content:publish', resource: 'content', action: 'publish', description: 'Publish content' },
    
    // Media management
    { name: 'media:create', resource: 'media', action: 'create', description: 'Upload media files' },
    { name: 'media:read', resource: 'media', action: 'read', description: 'View media files' },
    { name: 'media:delete', resource: 'media', action: 'delete', description: 'Delete media files' },
    
    // Content Type management
    { name: 'content-types:create', resource: 'content-types', action: 'create', description: 'Create content types' },
    { name: 'content-types:read', resource: 'content-types', action: 'read', description: 'View content types' },
    { name: 'content-types:update', resource: 'content-types', action: 'update', description: 'Update content types' },
    { name: 'content-types:delete', resource: 'content-types', action: 'delete', description: 'Delete content types' },
  ]

  const createdPermissions = []
  for (let i = 0; i < permissions.length; i++) {
    const perm = await prisma.permission.upsert({
      where: { id: i + 1 },
      update: {},
      create: permissions[i],
    })
    createdPermissions.push(perm)
  }

  console.log('✅ Created permissions:', createdPermissions.length)

  // Assign all permissions to Admin role
  for (const perm of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        }
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    })
  }

  // Assign content and media permissions to Editor role
  const editorPermissions = createdPermissions.filter(p => 
    p.resource === 'content' || 
    p.resource === 'media' || 
    (p.resource === 'content-types' && p.action === 'read') ||
    (p.resource === 'users' && p.action === 'read')
  )
  for (const perm of editorPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: editorRole.id,
          permissionId: perm.id,
        }
      },
      update: {},
      create: {
        roleId: editorRole.id,
        permissionId: perm.id,
      },
    })
  }

  // Assign read-only permissions to Viewer role
  const viewerPermissions = createdPermissions.filter(p => p.action === 'read')
  for (const perm of viewerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: viewerRole.id,
          permissionId: perm.id,
        }
      },
      update: {},
      create: {
        roleId: viewerRole.id,
        permissionId: perm.id,
      },
    })
  }

  console.log('✅ Assigned permissions to roles')

  // Assign Admin role to demo user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: adminRole.id,
      }
    },
    update: {},
    create: {
      userId: user.id,
      roleId: adminRole.id,
    },
  })

  console.log('✅ Assigned Admin role to demo user')

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
      customData: JSON.stringify({
        readingTime: '8 min',
        difficulty: 'beginner',
        featured: true,
      }),
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
      customData: JSON.stringify({
        readingTime: '12 min',
        difficulty: 'intermediate',
        featured: true,
      }),
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
      data: JSON.stringify({
        title: article1.title,
        content: article1.content,
        status: article1.status,
      }),
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
      data: JSON.stringify({
        title: article1.title,
        content: article1.content,
        status: article1.status,
      }),
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
  console.log('  - 3 roles created')
  console.log('  - 20 permissions created')
  console.log('  - Permissions assigned to roles')
  console.log('  - Admin role assigned to demo user')
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
