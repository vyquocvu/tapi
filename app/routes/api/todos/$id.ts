import { json } from '@tanstack/start'
import { createAPIFileRoute } from '@tanstack/start/api'
import prisma from '~/utils/prisma'

export const Route = createAPIFileRoute('/api/todos/$id')({
  PATCH: async ({ request, params }) => {
    const { id } = params
    const body = await request.json()
    const todo = await prisma.todo.update({
      where: { id },
      data: {
        completed: body.completed,
      },
    })
    return json(todo)
  },
  DELETE: async ({ params }) => {
    const { id } = params
    await prisma.todo.delete({
      where: { id },
    })
    return json({ success: true })
  },
})
