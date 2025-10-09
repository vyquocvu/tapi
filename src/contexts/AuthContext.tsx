import { createContext, useContext, useState, ReactNode } from 'react'

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
      {children}
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
