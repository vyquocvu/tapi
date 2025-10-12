/**
 * Example Content Type Definitions
 * This file demonstrates how to define content types using the builder
 */

import {
  ContentTypeBuilder,
  string,
  text,
  email,
  boolean,
  datetime,
  integer,
  manyToOne,
  oneToMany,
  enumeration,
} from '../../src/content-type-builder/index.js'

const builder = new ContentTypeBuilder()

// Define Article content type
const articleContentType = ContentTypeBuilder.create('api::article.article')
  .displayName('Article')
  .singularName('article')
  .pluralName('articles')
  .description('Blog articles with rich content')
  .field('title', string({ required: true, maxLength: 255 }))
  .field('slug', string({ required: true, unique: true, maxLength: 255 }))
  .field('content', text({ required: true }))
  .field('excerpt', text())
  .field('published', boolean({ default: false }))
  .field('publishedAt', datetime())
  .field('viewCount', integer({ default: 0 }))
  .field('status', enumeration(['draft', 'published', 'archived'], { default: 'draft' }))
  .field('author', manyToOne('api::user.user', { required: true }))
  .field('category', manyToOne('api::category.category'))
  .timestamps(true)
  .build()

// Define Category content type
const categoryContentType = ContentTypeBuilder.create('api::category.category')
  .displayName('Category')
  .singularName('category')
  .pluralName('categories')
  .description('Article categories')
  .field('name', string({ required: true, maxLength: 100 }))
  .field('slug', string({ required: true, unique: true, maxLength: 100 }))
  .field('description', text())
  .field('articles', oneToMany('api::article.article'))
  .timestamps(true)
  .build()

// Define User content type (extending the existing User model)
const userContentType = ContentTypeBuilder.create('api::user.user')
  .displayName('User')
  .singularName('user')
  .pluralName('users')
  .description('Application users')
  .field('email', email({ required: true, unique: true }))
  .field('password', string({ required: true }))
  .field('name', string({ required: true, maxLength: 255 }))
  .field('bio', text())
  .field('avatar', string())
  .field('articles', oneToMany('api::article.article'))
  .timestamps(true)
  .build()

// Register all content types
builder.define(articleContentType)
builder.define(categoryContentType)
builder.define(userContentType)

export default builder.getAll()
