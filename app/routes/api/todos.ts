import { json } from '@tanstack/start'
import { createAPIFileRoute } from '@tanstack/start/api'
import prisma from '~/utils/prisma'

export const Route = createAPIFileRoute('/api/todos')({
  GET: async () => {
    const todos = await prisma.todo.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return json(todos)
  },
  POST: async ({ request }) => {
    const body = await request.json()
    const todo = await prisma.todo.create({
      data: {
        title: body.title,
        completed: false,
      },
    })
    return json(todo)
  },
})
