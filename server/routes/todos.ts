import express from 'express'
import prisma from '../prisma.js'

const router = express.Router()

// Get all todos
router.get('/', async (_req, res) => {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: { createdAt: 'desc' },
    })
    res.json(todos)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch todos' })
  }
})

// Create a new todo
router.post('/', async (req, res) => {
  try {
    const { title } = req.body
    const todo = await prisma.todo.create({
      data: {
        title,
        completed: false,
      },
    })
    res.json(todo)
  } catch (error) {
    res.status(500).json({ error: 'Failed to create todo' })
  }
})

// Update a todo
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { completed } = req.body
    const todo = await prisma.todo.update({
      where: { id },
      data: { completed },
    })
    res.json(todo)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update todo' })
  }
})

// Delete a todo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    await prisma.todo.delete({
      where: { id },
    })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete todo' })
  }
})

export default router
