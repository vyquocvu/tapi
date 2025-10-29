/**
 * API Integration Tests
 * Tests for REST API endpoints validation
 */

import { describe, it, expect } from 'vitest'
import {
  validateRequiredFields,
  validateEmail,
  validateStringLength,
  validateNumericRange,
  validatePaginationParams,
  validateContentTypeUID,
  validateId,
} from '../src/middleware/validation'

describe('Validation Middleware', () => {
  describe('validateRequiredFields', () => {
    it('should pass when all required fields are present', () => {
      const data = { name: 'Test', email: 'test@example.com' }
      const result = validateRequiredFields(data, ['name', 'email'])
      
      expect(result.isValid).toBe(true)
      expect(result.errors.length).toBe(0)
    })

    it('should fail when required field is missing', () => {
      const data = { name: 'Test' }
      const result = validateRequiredFields(data, ['name', 'email'])
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBe(1)
      expect(result.errors[0].field).toBe('email')
    })

    it('should fail when required field is empty string', () => {
      const data = { name: '  ', email: 'test@example.com' }
      const result = validateRequiredFields(data, ['name', 'email'])
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBe(1)
      expect(result.errors[0].field).toBe('name')
    })

    it('should fail when required field is null', () => {
      const data = { name: null, email: 'test@example.com' }
      const result = validateRequiredFields(data, ['name', 'email'])
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBe(1)
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email format', () => {
      expect(validateEmail('user@example.com')).toBe(true)
      expect(validateEmail('test.user@domain.co.uk')).toBe(true)
    })

    it('should reject invalid email format', () => {
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('invalid@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('user@domain')).toBe(false)
    })
  })

  describe('validateStringLength', () => {
    it('should pass when string length is within bounds', () => {
      const result = validateStringLength('hello', 3, 10)
      expect(result.isValid).toBe(true)
    })

    it('should fail when string is too short', () => {
      const result = validateStringLength('hi', 5, 10)
      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toContain('at least 5')
    })

    it('should fail when string is too long', () => {
      const result = validateStringLength('hello world!', 3, 5)
      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toContain('not exceed 5')
    })
  })

  describe('validateNumericRange', () => {
    it('should pass when number is within range', () => {
      const result = validateNumericRange(5, 1, 10)
      expect(result.isValid).toBe(true)
    })

    it('should fail when number is below minimum', () => {
      const result = validateNumericRange(0, 1, 10)
      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toContain('at least 1')
    })

    it('should fail when number exceeds maximum', () => {
      const result = validateNumericRange(15, 1, 10)
      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toContain('not exceed 10')
    })
  })

  describe('validatePaginationParams', () => {
    it('should pass with valid pagination parameters', () => {
      const result = validatePaginationParams(0, 10)
      expect(result.isValid).toBe(true)
    })

    it('should pass with string parameters', () => {
      const result = validatePaginationParams('0', '20')
      expect(result.isValid).toBe(true)
    })

    it('should fail with negative skip', () => {
      const result = validatePaginationParams(-1, 10)
      expect(result.isValid).toBe(false)
      expect(result.errors[0].field).toBe('skip')
    })

    it('should fail with zero or negative take', () => {
      const result = validatePaginationParams(0, 0)
      expect(result.isValid).toBe(false)
      expect(result.errors[0].field).toBe('take')
    })

    it('should fail with take > 100', () => {
      const result = validatePaginationParams(0, 101)
      expect(result.isValid).toBe(false)
      expect(result.errors[0].field).toBe('take')
      expect(result.errors[0].message).toContain('not exceed 100')
    })

    it('should fail with invalid string parameters', () => {
      const result = validatePaginationParams('abc', '10')
      expect(result.isValid).toBe(false)
    })
  })

  describe('validateContentTypeUID', () => {
    it('should pass with valid content type UID', () => {
      const result = validateContentTypeUID('api::article.article')
      expect(result.isValid).toBe(true)
    })

    it('should pass with hyphenated names', () => {
      const result = validateContentTypeUID('api::blog-post.blog-post')
      expect(result.isValid).toBe(true)
    })

    it('should fail with invalid format', () => {
      const result = validateContentTypeUID('article')
      expect(result.isValid).toBe(false)
    })

    it('should fail with uppercase letters', () => {
      const result = validateContentTypeUID('api::Article.Article')
      expect(result.isValid).toBe(false)
    })

    it('should fail with spaces', () => {
      const result = validateContentTypeUID('api::blog post.blog post')
      expect(result.isValid).toBe(false)
    })

    it('should fail with missing parts', () => {
      expect(validateContentTypeUID('api::article').isValid).toBe(false)
      expect(validateContentTypeUID('article.article').isValid).toBe(false)
    })
  })

  describe('validateId', () => {
    it('should pass with valid positive integer', () => {
      const result = validateId(1)
      expect(result.isValid).toBe(true)
    })

    it('should pass with valid string number', () => {
      const result = validateId('42')
      expect(result.isValid).toBe(true)
    })

    it('should fail with zero', () => {
      const result = validateId(0)
      expect(result.isValid).toBe(false)
    })

    it('should fail with negative number', () => {
      const result = validateId(-1)
      expect(result.isValid).toBe(false)
    })

    it('should fail with invalid string', () => {
      const result = validateId('abc')
      expect(result.isValid).toBe(false)
    })

    it('should fail with decimal number', () => {
      const result = validateId('1.5')
      expect(result.isValid).toBe(false)
    })
  })
})
