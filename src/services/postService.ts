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
    const posts = await prisma.post.findMany({
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
    return posts
  } catch (error) {
    console.error('Error fetching posts:', error)
    throw new Error('Failed to fetch posts')
  }
}

export async function getPostById(id: number): Promise<Post | null> {
  try {
    const post = await prisma.post.findUnique({
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
    return post
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
    const post = await prisma.post.create({
      data: {
        title: data.title,
        body: data.body,
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
    return post
  } catch (error) {
    console.error('Error creating post:', error)
    throw new Error('Failed to create post')
  }
}
