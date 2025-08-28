/**
 * Unit tests for base service classes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  BaseService,
  CacheableService, 
  CachedService, 
  ServiceError, 
  ServiceRegistry 
} from '../../services/base.js';
import { CachedDocument } from '../../types/index.js';

// Mock implementation of CachedService for testing
class TestCachedService extends CachedService {
  public testMethod(key: string, content: string): CachedDocument {
    const document: CachedDocument = {
      url: `test://example.com/${key}`,
      content,
      lastUpdated: new Date(),
      category: 'test',
      metadata: { test: true },
    };
    
    this.cache.set(key, document);
    return document;
  }

  public testCacheHit(key: string): boolean {
    const cached = this.cache.get(key);
    const isHit = cached !== undefined;
    this.updateCacheStats(isHit);
    return isHit;
  }

  public testCacheExpiry(key: string, ttlMs: number = 1000): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return this.isCacheExpired(cached, ttlMs);
  }
}

// Mock service for testing registry
class TestService implements BaseService {
  public initializeCalled = false;
  public cleanupCalled = false;
  public shouldFailInitialize = false;
  public shouldFailCleanup = false;

  async initialize(): Promise<void> {
    if (this.shouldFailInitialize) {
      throw new Error('Initialize failed');
    }
    this.initializeCalled = true;
  }

  async cleanup(): Promise<void> {
    if (this.shouldFailCleanup) {
      throw new Error('Cleanup failed');
    }
    this.cleanupCalled = true;
  }
}

describe('ServiceError', () => {
  it('should create error with correct properties', () => {
    const originalError = new Error('Original error');
    const serviceError = new ServiceError(
      'Service failed',
      'TestService',
      'testMethod',
      originalError
    );

    expect(serviceError.message).toBe('Service failed');
    expect(serviceError.service).toBe('TestService');
    expect(serviceError.operation).toBe('testMethod');
    expect(serviceError.originalError).toBe(originalError);
    expect(serviceError.name).toBe('ServiceError');
  });

  it('should create error without original error', () => {
    const serviceError = new ServiceError(
      'Service failed',
      'TestService',
      'testMethod'
    );

    expect(serviceError.message).toBe('Service failed');
    expect(serviceError.service).toBe('TestService');
    expect(serviceError.operation).toBe('testMethod');
    expect(serviceError.originalError).toBeUndefined();
  });

  it('should inherit from Error correctly', () => {
    const serviceError = new ServiceError('Test', 'Service', 'method');
    expect(serviceError).toBeInstanceOf(Error);
  });
});

describe('CachedService', () => {
  let service: TestCachedService;

  beforeEach(() => {
    service = new TestCachedService();
  });

  describe('initialization and cleanup', () => {
    it('should initialize successfully', async () => {
      await expect(service.initialize()).resolves.toBeUndefined();
    });

    it('should cleanup successfully', async () => {
      // Add some data to cache
      service.testMethod('test', 'content');
      expect(service.getCacheStats().totalEntries).toBe(1);

      await service.cleanup();
      expect(service.getCacheStats().totalEntries).toBe(0);
    });
  });

  describe('cache operations', () => {
    it('should store and retrieve cached documents', () => {
      const document = service.testMethod('test-key', 'test content');
      
      expect(document.url).toBe('test://example.com/test-key');
      expect(document.content).toBe('test content');
      expect(document.category).toBe('test');
      expect(document.lastUpdated).toBeInstanceOf(Date);
    });

    it('should clear cache correctly', async () => {
      // Add some data
      service.testMethod('key1', 'content1');
      service.testMethod('key2', 'content2');
      service.testCacheHit('key1'); // Generate some stats

      const statsBefore = service.getCacheStats();
      expect(statsBefore.totalEntries).toBe(2);

      await service.clearCache();

      const statsAfter = service.getCacheStats();
      expect(statsAfter.totalEntries).toBe(0);
      expect(statsAfter.hitRate).toBe(0);
    });
  });

  describe('cache statistics', () => {
    it('should track cache stats correctly', () => {
      // Start with empty cache
      expect(service.getCacheStats().totalEntries).toBe(0);
      expect(service.getCacheStats().hitRate).toBe(0);

      // Add some entries
      service.testMethod('key1', 'content1');
      service.testMethod('key2', 'content2');

      // Test cache hits and misses
      service.testCacheHit('key1'); // hit
      service.testCacheHit('key3'); // miss
      service.testCacheHit('key2'); // hit

      const stats = service.getCacheStats();
      expect(stats.totalEntries).toBe(2);
      expect(stats.hitRate).toBe(2/3); // 2 hits out of 3 requests
      expect(stats.lastCleanup).toBeInstanceOf(Date);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    it('should estimate memory usage', () => {
      const statsEmpty = service.getCacheStats();
      expect(statsEmpty.memoryUsage).toBe(0);

      service.testMethod('key1', 'a'.repeat(100));
      service.testMethod('key2', 'b'.repeat(200));

      const statsWithData = service.getCacheStats();
      expect(statsWithData.memoryUsage).toBeGreaterThan(0);
      expect(statsWithData.memoryUsage).toBeGreaterThan(statsEmpty.memoryUsage);
    });
  });

  describe('cache expiry', () => {
    it('should detect expired cache entries', async () => {
      service.testMethod('test-key', 'content');
      
      // Should not be expired with default TTL
      expect(service.testCacheExpiry('test-key', 24 * 60 * 60 * 1000)).toBe(false);
      
      // Wait 1ms then check if expired with 1ms TTL (should be expired or very close)
      await new Promise(resolve => setTimeout(resolve, 2));
      expect(service.testCacheExpiry('test-key', 1)).toBe(true);
    });

    it('should handle non-existent cache entries', () => {
      expect(service.testCacheExpiry('non-existent-key')).toBe(false);
    });
  });
});

describe('ServiceRegistry', () => {
  let registry: ServiceRegistry;

  beforeEach(() => {
    registry = new ServiceRegistry();
  });

  describe('service registration', () => {
    it('should register and retrieve services', () => {
      const service = new TestService();
      registry.register('test-service', service);

      const retrieved = registry.get<TestService>('test-service');
      expect(retrieved).toBe(service);
    });

    it('should return undefined for non-existent services', () => {
      const retrieved = registry.get('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should allow overriding services', () => {
      const service1 = new TestService();
      const service2 = new TestService();

      registry.register('test-service', service1);
      registry.register('test-service', service2);

      const retrieved = registry.get<TestService>('test-service');
      expect(retrieved).toBe(service2);
    });
  });

  describe('service lifecycle', () => {
    it('should initialize all services', async () => {
      const service1 = new TestService();
      const service2 = new TestService();

      registry.register('service1', service1);
      registry.register('service2', service2);

      await registry.initializeAll();

      expect(service1.initializeCalled).toBe(true);
      expect(service2.initializeCalled).toBe(true);
    });

    it('should handle initialization failures', async () => {
      const workingService = new TestService();
      const failingService = new TestService();
      failingService.shouldFailInitialize = true;

      registry.register('working', workingService);
      registry.register('failing', failingService);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(registry.initializeAll()).rejects.toThrow('Initialize failed');
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should cleanup all services', async () => {
      const service1 = new TestService();
      const service2 = new TestService();

      registry.register('service1', service1);
      registry.register('service2', service2);

      await registry.cleanupAll();

      expect(service1.cleanupCalled).toBe(true);
      expect(service2.cleanupCalled).toBe(true);
    });

    it('should continue cleanup even if some services fail', async () => {
      const workingService = new TestService();
      const failingService = new TestService();
      failingService.shouldFailCleanup = true;

      registry.register('working', workingService);
      registry.register('failing', failingService);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Should not throw even if one service fails
      await expect(registry.cleanupAll()).resolves.toBeUndefined();

      expect(workingService.cleanupCalled).toBe(true);
      expect(failingService.cleanupCalled).toBe(false); // Failed before setting flag
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle empty registry during initialization', async () => {
      await expect(registry.initializeAll()).resolves.toBeUndefined();
    });

    it('should handle empty registry during cleanup', async () => {
      await expect(registry.cleanupAll()).resolves.toBeUndefined();
    });
  });
});