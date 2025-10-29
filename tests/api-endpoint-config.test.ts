/**
 * API Endpoint Configuration Service Tests
 */

import { describe, it, expect, vi } from 'vitest'
import {
  getEndpointConfig,
  getAllEndpointConfigs,
  updateEndpointConfig,
} from '../src/services/apiEndpointConfigService'
import * as contentTypeService from '../src/services/contentTypeService'

// Mock the contentTypeService
vi.mock('../src/services/contentTypeService', () => ({
  getContentType: vi.fn(),
  getAllContentTypes: vi.fn(),
}))

describe('API Endpoint Configuration Service', () => {
  describe('getEndpointConfig', () => {
    it('should return a default endpoint configuration for a new content type', async () => {
      // @ts-ignore
      contentTypeService.getContentType.mockResolvedValue({
        uid: 'api::new-content-type.new-content-type',
        displayName: 'New Content Type',
      })
      const config = await getEndpointConfig('api::new-content-type.new-content-type')
      expect(config).not.toBeNull()
      expect(config?.isPublic).toBe(false)
    })

    it('should return null for a non-existent content type', async () => {
      // @ts-ignore
      contentTypeService.getContentType.mockResolvedValue(null)
      const config = await getEndpointConfig('api::non-existent.non-existent')
      expect(config).toBeNull()
    })
  })

  describe('getAllEndpointConfigs', () => {
    it('should return all endpoint configurations', async () => {
      // @ts-ignore
      contentTypeService.getAllContentTypes.mockResolvedValue({
        'api::article.article': {
          uid: 'api::article.article',
          displayName: 'Article',
        },
      })
      const configs = await getAllEndpointConfigs()
      expect(configs).toBeInstanceOf(Array)
      expect(configs.length).toBeGreaterThan(0)
    })
  })

  describe('updateEndpointConfig', () => {
    it('should update an endpoint configuration', async () => {
      const newConfig = { isPublic: true }
      const updatedConfig = await updateEndpointConfig('api::article.article', newConfig)
      expect(updatedConfig.isPublic).toBe(true)
    })
  })
})
