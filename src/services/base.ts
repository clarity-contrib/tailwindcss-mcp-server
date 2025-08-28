/**
 * Base service interfaces and abstract classes for TailwindCSS MCP Server
 */

import { CachedDocument } from '../types/index.js';

/**
 * Base interface for all services
 */
export interface BaseService {
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
}

/**
 * Interface for services that provide caching functionality
 */
export interface CacheableService extends BaseService {
  clearCache(): Promise<void>;
  getCacheStats(): CacheStats;
}

export interface CacheStats {
  totalEntries: number;
  memoryUsage: number;
  hitRate: number;
  lastCleanup: Date;
}

/**
 * Abstract base class for cached services
 */
export abstract class CachedService implements CacheableService {
  protected cache: Map<string, CachedDocument> = new Map();
  protected cacheHits = 0;
  protected cacheRequests = 0;
  protected lastCleanup = new Date();

  async initialize(): Promise<void> {
    // Override in subclasses
  }

  async cleanup(): Promise<void> {
    this.cache.clear();
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheRequests = 0;
    this.lastCleanup = new Date();
  }

  getCacheStats(): CacheStats {
    return {
      totalEntries: this.cache.size,
      memoryUsage: this.estimateMemoryUsage(),
      hitRate: this.cacheRequests > 0 ? this.cacheHits / this.cacheRequests : 0,
      lastCleanup: this.lastCleanup,
    };
  }

  protected updateCacheStats(isHit: boolean): void {
    this.cacheRequests++;
    if (isHit) {
      this.cacheHits++;
    }
  }

  protected isCacheExpired(item: CachedDocument, ttlMs: number = 24 * 60 * 60 * 1000): boolean {
    return Date.now() - item.lastUpdated.getTime() > ttlMs;
  }

  private estimateMemoryUsage(): number {
    let totalSize = 0;
    for (const [key, value] of this.cache) {
      totalSize += key.length * 2; // Rough estimate for string keys
      totalSize += value.content.length * 2; // Rough estimate for content
      totalSize += value.url.length * 2; // URL size
      totalSize += 200; // Rough estimate for other properties and overhead
    }
    return totalSize;
  }
}

/**
 * Error handling utilities
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly service: string,
    public readonly operation: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

/**
 * Service registry for managing service instances
 */
export class ServiceRegistry {
  private services: Map<string, BaseService> = new Map();

  register<T extends BaseService>(name: string, service: T): void {
    this.services.set(name, service);
  }

  get<T extends BaseService>(name: string): T | undefined {
    return this.services.get(name) as T;
  }

  async initializeAll(): Promise<void> {
    const initPromises = Array.from(this.services.values()).map(service => 
      service.initialize().catch(error => {
        console.error(`Failed to initialize service:`, error);
        throw error;
      })
    );
    
    await Promise.all(initPromises);
  }

  async cleanupAll(): Promise<void> {
    const cleanupPromises = Array.from(this.services.values()).map(service => 
      service.cleanup().catch(error => {
        console.error(`Failed to cleanup service:`, error);
        // Continue cleanup even if one service fails
      })
    );
    
    await Promise.allSettled(cleanupPromises);
  }
}