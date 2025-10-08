import { useState, useEffect } from 'react'
import type { Todo } from './types/Todo'
import './App.css'

// Use /api for both development (via Vite proxy) and production (Vercel routing)
const API_URL = '/api'

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    try {
      const response = await fetch(`${API_URL}/todos`)
      if (!response.ok) throw new Error('Failed to fetch todos')
      const data = await response.json()
      setTodos(data)
      setError(null)
    } catch (err) {
      setError('Failed to load todos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodoTitle.trim()) return

    try {
      const response = await fetch(`${API_URL}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTodoTitle }),
      })
      if (!response.ok) throw new Error('Failed to create todo')
      const newTodo = await response.json()
      setTodos([newTodo, ...todos])
      setNewTodoTitle('')
      setError(null)
    } catch (err) {
      setError('Failed to add todo')
      console.error(err)
    }
  }

  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      const response = await fetch(`${API_URL}/todos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !completed }),
      })
      if (!response.ok) throw new Error('Failed to update todo')
      const updatedTodo = await response.json()
      setTodos(todos.map((todo) => (todo.id === id ? updatedTodo : todo)))
      setError(null)
    } catch (err) {
      setError('Failed to update todo')
      console.error(err)
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/todos/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete todo')
      setTodos(todos.filter((todo) => todo.id !== id))
      setError(null)
    } catch (err) {
      setError('Failed to delete todo')
      console.error(err)
    }
  }

  const activeTodos = todos.filter((todo) => !todo.completed)
  const completedTodos = todos.filter((todo) => todo.completed)

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container">
      <h1>📝 Todo List</h1>
      <p className="subtitle">Full-stack app with React, Express, and Prisma</p>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={addTodo} className="add-todo-form">
        <input
          type="text"
          value={newTodoTitle}
          onChange={(e) => setNewTodoTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="todo-input"
        />
        <button type="submit" className="add-button">
          Add Todo
        </button>
      </form>

      <div className="stats">
        <span>
          {activeTodos.length} active {activeTodos.length === 1 ? 'task' : 'tasks'}
        </span>
        <span>•</span>
        <span>{completedTodos.length} completed</span>
      </div>

      {activeTodos.length > 0 && (
        <div className="todo-section">
          <h2>Active Tasks</h2>
          <ul className="todo-list">
            {activeTodos.map((todo) => (
              <li key={todo.id} className="todo-item">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id, todo.completed)}
                  className="todo-checkbox"
                />
                <span className="todo-title">{todo.title}</span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="delete-button"
                  aria-label="Delete todo"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {completedTodos.length > 0 && (
        <div className="todo-section">
          <h2>Completed Tasks</h2>
          <ul className="todo-list">
            {completedTodos.map((todo) => (
              <li key={todo.id} className="todo-item completed">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id, todo.completed)}
                  className="todo-checkbox"
                />
                <span className="todo-title">{todo.title}</span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="delete-button"
                  aria-label="Delete todo"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {todos.length === 0 && (
        <div className="empty-state">
          <p>No todos yet. Add one to get started!</p>
        </div>
      )}
    </div>
  )
}

export default App
