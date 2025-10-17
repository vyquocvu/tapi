import prisma from '../db/prisma.js'

export interface Post {
  id: number
  title: string
  body: string
  published: boolean
  createdAt: Date
  updatedAt: Date
  author?: {
    id: number
    name: string
    email: string
  }
}

export async function getAllPosts(): Promise<Post[]> {
  try {
    // Using article model instead of deprecated post model
    const articles = await prisma.article.findMany({
      where: { published: true },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    // Map articles to legacy post format for backward compatibility
    return articles.map(article => ({
      id: article.id,
      title: article.title,
      body: article.content || article.excerpt || '',
      published: article.published || false,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      author: article.author,
    }))
  } catch (error) {
    console.error('Error fetching posts:', error)
    throw new Error('Failed to fetch posts')
  }
}

export async function getPostById(id: number): Promise<Post | null> {
  try {
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
    
    if (!article) return null
    
    // Map article to legacy post format
    return {
      id: article.id,
      title: article.title,
      body: article.content || article.excerpt || '',
      published: article.published || false,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      author: article.author,
    }
  } catch (error) {
    console.error('Error fetching post:', error)
    throw new Error('Failed to fetch post')
  }
}

export async function createPost(data: {
  title: string
  body: string
  published?: boolean
  authorId: number
}): Promise<Post> {
  try {
    const article = await prisma.article.create({
      data: {
        title: data.title,
        content: data.body,
        slug: data.title.toLowerCase().replace(/\s+/g, '-'),
        published: data.published ?? false,
        authorId: data.authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
    
    // Map article to legacy post format
    return {
      id: article.id,
      title: article.title,
      body: article.content,
      published: article.published || false,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      author: article.author,
    }
  } catch (error) {
    console.error('Error creating post:', error)
    throw new Error('Failed to create post')
  }
}
