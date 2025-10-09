export interface User {
  id: number
  email: string
  name: string
}

export interface Post {
  id: number
  title: string
  body: string
  published: boolean
  createdAt: string
  updatedAt: string
  author?: {
    id: number
    name: string
    email: string
  }
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  token?: string
  user?: User
  error?: string
}
