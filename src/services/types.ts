/**
 * Type Definitions for Services
 * Shared types and interfaces used across query functions and services
 */

import type { ContentTypeDefinition } from '../content-type-builder/types'

// ============================================================================
// API RESPONSE
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ============================================================================
// CONTENT TYPES
// ============================================================================

export interface ContentTypeRegistry {
  [uid: string]: ContentTypeDefinition
}

export interface ContentEntry {
  id: number
  [key: string]: any
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

// ============================================================================
// USERS
// ============================================================================

export interface User {
  id: number
  email: string
  name: string
  bio?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  roles?: Role[]
  permissions?: Permission[]
}

// ============================================================================
// ROLES
// ============================================================================

export interface Role {
  id: number
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  permissions?: Permission[]
}

// ============================================================================
// PERMISSIONS
// ============================================================================

export interface Permission {
  id: number
  name: string
  action: string
  resource: string
  description: string | null
  createdAt: string
  updatedAt: string
}

// ============================================================================
// MEDIA
// ============================================================================

export interface MediaFile {
  id: string
  name: string
  originalName: string
  size: number
  mimeType: string
  url: string
  provider: string
  createdAt: string
  updatedAt: string
}

export interface MediaProviderInfo {
  name: string
  provider: string
  configured: boolean
  available: boolean
}

// ============================================================================
// API DASHBOARD
// ============================================================================

export interface APIStatistics {
  totalEndpoints: number
  publicEndpoints: number
  privateEndpoints: number
  contentTypeEndpoints: number
}

export interface ActivityLog {
  id: string
  method: string
  endpoint: string
  contentType?: string
  timestamp: string
  statusCode: number
  responseTime: number
}

export interface EndpointInfo {
  path: string
  method: string
  description: string
  isPublic: boolean
  requiresAuth: boolean
}

export interface EndpointDocumentation {
  category: string
  endpoints: EndpointInfo[]
}

export interface EndpointConfig {
  uid: string
  description: string
  isPublic: boolean
  path: string
  rateLimit: number
}

export interface DashboardOverview {
  statistics: APIStatistics
  recentActivity: ActivityLog[]
}
