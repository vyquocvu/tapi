import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'

export const Route = createFileRoute('/login')({
  component: LoginComponent,
})

function LoginComponent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Redirect if already logged in
  if (isAuthenticated) {
    navigate({ to: '/' })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      navigate({ to: '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h1>Login</h1>
      <div className="card" style={{ maxWidth: '400px', margin: '2rem auto' }}>
        <h3>Sign In</h3>
        <p style={{ marginBottom: '1.5rem', color: '#7f8c8d' }}>
          Enter any email and password to login (demo mode)
        </p>
        
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Enter your password"
            />
          </div>
          
          <button type="submit" disabled={isLoading} style={{ width: '100%' }}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>

      <div className="info-box" style={{ maxWidth: '400px', margin: '1rem auto' }}>
        <h3>💡 Demo Login</h3>
        <p>
          This is a demonstration login page. Enter any email and password to sign in.
          In a production app, this would authenticate against a real backend API.
        </p>
      </div>
    </div>
  )
}
