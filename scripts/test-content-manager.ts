/**
 * Test Content Manager Service
 * 
 * Tests CRUD operations with the content manager for dynamically defined content types
 */

import { 
  findMany, 
  findOne, 
  create, 
  update, 
  deleteOne, 
  count 
} from '../src/services/contentManagerService.js'

async function testContentManager() {
  console.log('🧪 Testing Content Manager Service\n')

  try {
    // Test 1: Find all articles
    console.log('1️⃣ Testing findMany for articles...')
    const articles = await findMany('api::article.article', {
      take: 5,
    })
    console.log(`✅ Found ${articles.length} articles`)
    if (articles.length > 0) {
      console.log('   Sample:', articles[0])
    }
    console.log()

    // Test 2: Count articles
    console.log('2️⃣ Testing count for articles...')
    const articleCount = await count('api::article.article')
    console.log(`✅ Total articles: ${articleCount}`)
    console.log()

    // Test 3: Find all categories
    console.log('3️⃣ Testing findMany for categories...')
    const categories = await findMany('api::category.category')
    console.log(`✅ Found ${categories.length} categories`)
    if (categories.length > 0) {
      console.log('   Sample:', categories[0])
    }
    console.log()

    // Test 4: Create a new category
    console.log('4️⃣ Testing create for category...')
    const newCategory = await create('api::category.category', {
      data: {
        name: 'Test Category',
        slug: `test-category-${Date.now()}`,
        description: 'A test category created by content manager',
      },
    })
    console.log('✅ Created category:', newCategory)
    console.log()

    // Test 5: Find the created category
    console.log('5️⃣ Testing findOne for the created category...')
    const foundCategory = await findOne('api::category.category', newCategory.id)
    console.log('✅ Found category:', foundCategory)
    console.log()

    // Test 6: Update the category
    console.log('6️⃣ Testing update for the created category...')
    const updatedCategory = await update('api::category.category', {
      where: { id: newCategory.id },
      data: {
        description: 'Updated description',
      },
    })
    console.log('✅ Updated category:', updatedCategory)
    console.log()

    // Test 7: Delete the category
    console.log('7️⃣ Testing delete for the created category...')
    const deleted = await deleteOne('api::category.category', {
      where: { id: newCategory.id },
    })
    console.log('✅ Deleted category:', deleted)
    console.log()

    // Test 8: Try to find deleted category (should be null)
    console.log('8️⃣ Testing findOne for deleted category (should fail)...')
    try {
      const notFound = await findOne('api::category.category', newCategory.id)
      if (notFound === null) {
        console.log('✅ Category not found (as expected)')
      } else {
        console.log('❌ Category still exists (unexpected)')
      }
    } catch (error) {
      console.log('✅ Category not found (as expected)')
    }
    console.log()

    // Test 9: Test with invalid content type
    console.log('9️⃣ Testing with invalid content type (should fail)...')
    try {
      await findMany('api::invalid.invalid')
      console.log('❌ Should have thrown an error')
    } catch (error) {
      console.log('✅ Correctly threw error:', error instanceof Error ? error.message : error)
    }
    console.log()

    // Test 10: Test validation - missing required field
    console.log('🔟 Testing validation with missing required field (should fail)...')
    try {
      await create('api::category.category', {
        data: {
          // Missing required 'name' and 'slug' fields
          description: 'Test',
        },
      })
      console.log('❌ Should have thrown a validation error')
    } catch (error) {
      console.log('✅ Correctly threw validation error:', error instanceof Error ? error.message : error)
    }
    console.log()

    console.log('✨ All tests completed!')
  } catch (error) {
    console.error('❌ Test failed:', error)
    throw error
  }
}

// Run tests
testContentManager()
  .then(() => {
    console.log('\n🎉 Content Manager tests passed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Content Manager tests failed:', error)
    process.exit(1)
  })
