/**
 * HTTP Mock utilities for testing HTTP requests
 */

import { vi } from 'vitest';
import type { AxiosResponse, AxiosRequestConfig } from 'axios';

export interface MockResponse {
  status: number;
  data: any;
  headers?: Record<string, string>;
}

export interface MockRequestMatcher {
  url?: string | RegExp;
  method?: string;
  headers?: Record<string, string>;
}

class HttpMockManager {
  private mocks: Map<string, MockResponse> = new Map();
  private requestHistory: Array<{ url: string; config: AxiosRequestConfig }> = [];

  /**
   * Mock a specific HTTP request
   */
  mockRequest(matcher: MockRequestMatcher, response: MockResponse): void {
    const key = this.createMockKey(matcher);
    this.mocks.set(key, response);
  }

  /**
   * Mock multiple requests at once
   */
  mockRequests(requests: Array<{ matcher: MockRequestMatcher; response: MockResponse }>): void {
    requests.forEach(({ matcher, response }) => {
      this.mockRequest(matcher, response);
    });
  }

  /**
   * Get mock response for a request
   */
  getMockResponse(url: string, method: string = 'GET'): MockResponse | undefined {
    // Try exact match first
    const exactKey = this.createMockKey({ url, method });
    const exactMatch = this.mocks.get(exactKey);
    if (exactMatch) return exactMatch;

    // Try pattern matching
    for (const [key, response] of this.mocks.entries()) {
      const { url: urlPattern, method: methodPattern } = this.parseMockKey(key);
      
      if (methodPattern && methodPattern.toUpperCase() !== method.toUpperCase()) {
        continue;
      }

      if (urlPattern instanceof RegExp && urlPattern.test(url)) {
        return response;
      }
      
      if (typeof urlPattern === 'string' && url.includes(urlPattern)) {
        return response;
      }
    }

    return undefined;
  }

  /**
   * Record a request for testing purposes
   */
  recordRequest(url: string, config: AxiosRequestConfig): void {
    this.requestHistory.push({ url, config });
  }

  /**
   * Get all recorded requests
   */
  getRequestHistory(): Array<{ url: string; config: AxiosRequestConfig }> {
    return [...this.requestHistory];
  }

  /**
   * Check if a specific request was made
   */
  wasRequestMade(matcher: MockRequestMatcher): boolean {
    return this.requestHistory.some(({ url, config }) => {
      if (matcher.url) {
        if (typeof matcher.url === 'string' && !url.includes(matcher.url)) {
          return false;
        }
        if (matcher.url instanceof RegExp && !matcher.url.test(url)) {
          return false;
        }
      }

      if (matcher.method && config.method?.toUpperCase() !== matcher.method.toUpperCase()) {
        return false;
      }

      return true;
    });
  }

  /**
   * Clear all mocks and request history
   */
  clear(): void {
    this.mocks.clear();
    this.requestHistory.length = 0;
  }

  /**
   * Reset only request history
   */
  clearHistory(): void {
    this.requestHistory.length = 0;
  }

  private createMockKey(matcher: MockRequestMatcher): string {
    const urlKey = matcher.url instanceof RegExp ? matcher.url.toString() : (matcher.url || '*');
    const methodKey = matcher.method || 'GET';
    return `${methodKey}:${urlKey}`;
  }

  private parseMockKey(key: string): { method?: string; url?: string | RegExp } {
    const [method, urlString] = key.split(':', 2);
    let url: string | RegExp | undefined = urlString;
    
    if (urlString.startsWith('/') && urlString.endsWith('/')) {
      // It's a regex pattern
      url = new RegExp(urlString.slice(1, -1));
    }
    
    return { method: method === '*' ? undefined : method, url };
  }
}

// Global mock manager instance
export const httpMock = new HttpMockManager();

/**
 * Mock axios for testing
 */
export const mockAxios = () => {
  const mockInstance = {
    get: vi.fn().mockImplementation((url: string, config?: AxiosRequestConfig) => {
      httpMock.recordRequest(url, { ...config, method: 'GET' });
      const mockResponse = httpMock.getMockResponse(url, 'GET');
      
      if (mockResponse) {
        return Promise.resolve({
          data: mockResponse.data,
          status: mockResponse.status,
          statusText: mockResponse.status === 200 ? 'OK' : 'Error',
          headers: mockResponse.headers || {},
          config: config || {},
        } as AxiosResponse);
      }
      
      return Promise.reject(new Error(`No mock found for GET ${url}`));
    }),
    
    post: vi.fn().mockImplementation((url: string, data?: any, config?: AxiosRequestConfig) => {
      httpMock.recordRequest(url, { ...config, method: 'POST', data });
      const mockResponse = httpMock.getMockResponse(url, 'POST');
      
      if (mockResponse) {
        return Promise.resolve({
          data: mockResponse.data,
          status: mockResponse.status,
          statusText: mockResponse.status === 200 ? 'OK' : 'Error',
          headers: mockResponse.headers || {},
          config: config || {},
        } as AxiosResponse);
      }
      
      return Promise.reject(new Error(`No mock found for POST ${url}`));
    }),
    
    create: vi.fn().mockReturnThis(),
  };

  return mockInstance;
};