import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  email: string
  name: string
  id?: number
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore user session on mount if token exists
  useEffect(() => {
    const restoreSession = async () => {
      const token = sessionStorage.getItem('authToken')
      if (token) {
        try {
          // Verify token by fetching user data from /api/me
          const response = await fetch('/api/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success && data.data?.user) {
              setUser({
                id: data.data.user.userId,
                email: data.data.user.email,
                name: data.data.user.email.split('@')[0],
              })
            }
          } else {
            // Token is invalid, remove it
            sessionStorage.removeItem('authToken')
          }
        } catch (error) {
          console.error('Failed to restore session:', error)
          sessionStorage.removeItem('authToken')
        }
      }
      setIsLoading(false)
    }

    restoreSession()
  }, [])

  const login = async (email: string, password: string) => {
    // Call the real API endpoint
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Invalid credentials')
    }

    // Store token in sessionStorage for future requests
    if (data.token) {
      sessionStorage.setItem('authToken', data.token)
    }

    // Set user state
    setUser({
      id: data.user.id,
      email: data.user.email,
      name: data.user.email.split('@')[0],
    })
  }

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem('authToken')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {isLoading ? null : children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
