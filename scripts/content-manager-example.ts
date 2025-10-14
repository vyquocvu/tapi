/**
 * Content Manager Example
 * 
 * This example demonstrates how to use the Content Manager service
 * to perform CRUD operations on dynamic content types.
 */

import {
  findMany,
  findOne,
  create,
  update,
  deleteOne,
  count
} from '../src/services/contentManagerService.js'

/**
 * Example 1: Managing Articles
 */
async function manageArticles() {
  console.log('📰 Managing Articles\n')

  // Get all published articles
  const publishedArticles = await findMany('api::article.article', {
    where: { published: true },
    include: {
      author: true,
      category: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })
  console.log(`Found ${publishedArticles.length} published articles`)

  // Get a specific article
  if (publishedArticles.length > 0) {
    const article = await findOne('api::article.article', publishedArticles[0].id)
    console.log('Article details:', article?.title)
  }

  // Count total articles
  const totalArticles = await count('api::article.article')
  console.log(`Total articles: ${totalArticles}`)
}

/**
 * Example 2: Managing Categories
 */
async function manageCategories() {
  console.log('\n📁 Managing Categories\n')

  // Create a new category
  const newCategory = await create('api::category.category', {
    data: {
      name: 'Technology',
      slug: 'technology',
      description: 'Articles about technology and innovation',
    },
  })
  console.log('Created category:', newCategory.name)

  // Update the category
  const updatedCategory = await update('api::category.category', {
    where: { id: newCategory.id },
    data: {
      description: 'Updated description about technology',
    },
  })
  console.log('Updated category:', updatedCategory.name)

  // Get all categories
  const categories = await findMany('api::category.category')
  console.log(`Total categories: ${categories.length}`)

  // Delete the category
  await deleteOne('api::category.category', {
    where: { id: newCategory.id },
  })
  console.log('Deleted category')
}

/**
 * Example 3: Working with Relations
 */
async function workWithRelations() {
  console.log('\n🔗 Working with Relations\n')

  // Get articles with their authors and categories
  const articles = await findMany('api::article.article', {
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    take: 5,
  })

  console.log('Articles with relations:')
  articles.forEach((article) => {
    console.log(`- ${article.title}`)
    console.log(`  Author: ${article.author?.name}`)
    console.log(`  Category: ${article.category?.name || 'None'}`)
  })
}

/**
 * Example 4: Pagination
 */
async function demonstratePagination() {
  console.log('\n📄 Pagination Example\n')

  const pageSize = 5
  const page = 1

  // Get paginated results
  const articles = await findMany('api::article.article', {
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { createdAt: 'desc' },
  })

  // Get total count for pagination metadata
  const total = await count('api::article.article')

  console.log(`Page ${page} of ${Math.ceil(total / pageSize)}`)
  console.log(`Showing ${articles.length} of ${total} articles`)
}

/**
 * Example 5: Advanced Filtering
 */
async function advancedFiltering() {
  console.log('\n🔍 Advanced Filtering\n')

  // Filter by multiple conditions
  const draftArticles = await findMany('api::article.article', {
    where: {
      status: 'draft',
      published: false,
    },
    orderBy: { updatedAt: 'desc' },
  })

  console.log(`Found ${draftArticles.length} draft articles`)

  // Get articles by specific author
  const authorArticles = await findMany('api::article.article', {
    where: {
      authorId: 1,
    },
    include: {
      author: true,
    },
  })

  console.log(`Found ${authorArticles.length} articles by author`)
}

/**
 * Example 6: Error Handling
 */
async function demonstrateErrorHandling() {
  console.log('\n⚠️  Error Handling\n')

  try {
    // Try to access non-existent content type
    await findMany('api::invalid.invalid')
  } catch (error) {
    console.log('Caught error:', error instanceof Error ? error.message : error)
  }

  try {
    // Try to create with missing required fields
    await create('api::article.article', {
      data: {
        // Missing required fields like title, slug, etc.
      },
    })
  } catch (error) {
    console.log('Validation error:', error instanceof Error ? error.message : error)
  }
}

/**
 * Main function to run all examples
 */
async function main() {
  console.log('🚀 Content Manager Examples\n')
  console.log('=' .repeat(50))

  try {
    await manageArticles()
    await manageCategories()
    await workWithRelations()
    await demonstratePagination()
    await advancedFiltering()
    await demonstrateErrorHandling()

    console.log('\n' + '='.repeat(50))
    console.log('✅ All examples completed successfully!')
  } catch (error) {
    console.error('\n❌ Error running examples:', error)
    throw error
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

export {
  manageArticles,
  manageCategories,
  workWithRelations,
  demonstratePagination,
  advancedFiltering,
  demonstrateErrorHandling,
}
