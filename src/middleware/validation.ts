/**
 * Validation Middleware
 * Provides standardized input validation and sanitization
 */

export interface ValidationError {
  field: string
  message: string
  value?: any
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): ValidationResult {
  const errors: ValidationError[] = []

  for (const field of requiredFields) {
    if (!(field in data) || data[field] === null || data[field] === undefined) {
      errors.push({
        field,
        message: `Field '${field}' is required`,
      })
    } else if (typeof data[field] === 'string' && data[field].trim() === '') {
      errors.push({
        field,
        message: `Field '${field}' cannot be empty`,
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate string length
 */
export function validateStringLength(
  value: string,
  minLength?: number,
  maxLength?: number
): ValidationResult {
  const errors: ValidationError[] = []

  if (minLength !== undefined && value.length < minLength) {
    errors.push({
      field: 'value',
      message: `Value must be at least ${minLength} characters`,
      value: value.length,
    })
  }

  if (maxLength !== undefined && value.length > maxLength) {
    errors.push({
      field: 'value',
      message: `Value must not exceed ${maxLength} characters`,
      value: value.length,
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate numeric range
 */
export function validateNumericRange(
  value: number,
  min?: number,
  max?: number
): ValidationResult {
  const errors: ValidationError[] = []

  if (min !== undefined && value < min) {
    errors.push({
      field: 'value',
      message: `Value must be at least ${min}`,
      value,
    })
  }

  if (max !== undefined && value > max) {
    errors.push({
      field: 'value',
      message: `Value must not exceed ${max}`,
      value,
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Sanitize string input (basic XSS prevention)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(
  skip?: number | string,
  take?: number | string
): ValidationResult {
  const errors: ValidationError[] = []

  if (skip !== undefined) {
    const skipNum = typeof skip === 'string' ? parseInt(skip, 10) : skip
    if (isNaN(skipNum) || skipNum < 0) {
      errors.push({
        field: 'skip',
        message: 'Skip parameter must be a non-negative integer',
        value: skip,
      })
    }
  }

  if (take !== undefined) {
    const takeNum = typeof take === 'string' ? parseInt(take, 10) : take
    if (isNaN(takeNum) || takeNum <= 0) {
      errors.push({
        field: 'take',
        message: 'Take parameter must be a positive integer',
        value: take,
      })
    } else if (takeNum > 100) {
      errors.push({
        field: 'take',
        message: 'Take parameter must not exceed 100',
        value: take,
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate content type UID format
 */
export function validateContentTypeUID(uid: string): ValidationResult {
  const errors: ValidationError[] = []
  
  // Format should be: api::model-name.model-name
  const uidRegex = /^api::[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/
  
  if (!uidRegex.test(uid)) {
    errors.push({
      field: 'uid',
      message: 'Content type UID must follow format: api::model-name.model-name',
      value: uid,
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate ID parameter
 */
export function validateId(id: string | number): ValidationResult {
  const errors: ValidationError[] = []
  
  const numId = typeof id === 'string' ? parseInt(id, 10) : id
  
  if (isNaN(numId) || numId <= 0) {
    errors.push({
      field: 'id',
      message: 'ID must be a positive integer',
      value: id,
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
