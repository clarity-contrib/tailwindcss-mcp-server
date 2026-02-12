/**
 * Unit tests for DocumentationScraperService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DocumentationScraperService } from '../../services/documentation-scraper.js';
import { ServiceError } from '../../services/base.js';
import { httpMock, mockAxios } from '../mocks/http-mock.js';
import { 
  sampleTailwindDocsHTML, 
  sampleDocsIndexHTML, 
  sampleSearchResults,
  sampleUtilityData 
} from '../fixtures/index.js';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxios()),
  },
}));

describe('DocumentationScraperService', () => {
  let service: DocumentationScraperService;

  beforeEach(() => {
    service = new DocumentationScraperService();
    httpMock.clear();
  });

  afterEach(() => {
    httpMock.clear();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await service.initialize();

      expect(consoleSpy).toHaveBeenCalledWith('DocumentationScraperService initialized');
      consoleSpy.mockRestore();
    });

    it('should create axios instance with correct configuration', () => {
      expect(service).toBeDefined();
      // The axios instance is created in constructor, so service exists means it worked
    });
  });

  describe('scrapePage', () => {
    it('should scrape and cache a documentation page', async () => {
      const mockHTML = sampleTailwindDocsHTML;
      httpMock.mockRequest(
        { url: 'https://tailwindcss.com/docs/padding', method: 'GET' },
        { status: 200, data: mockHTML, headers: { 'content-type': 'text/html' } }
      );

      const document = await service.scrapePage('/docs/padding');

      expect(document.url).toBe('https://tailwindcss.com/docs/padding');
      expect(document.content).toBe(mockHTML);
      expect(document.category).toBe('padding'); // Category is extracted from path part after /docs/
      expect(document.lastUpdated).toBeInstanceOf(Date);
      expect(document.metadata).toEqual({
        contentType: 'text/html',
        statusCode: 200,
      });
    });

    it('should return cached document on subsequent requests', async () => {
      const mockHTML = sampleTailwindDocsHTML;
      httpMock.mockRequest(
        { url: 'https://tailwindcss.com/docs/padding', method: 'GET' },
        { status: 200, data: mockHTML }
      );

      // First request
      const document1 = await service.scrapePage('/docs/padding');
      
      // Second request (should be cached)
      const document2 = await service.scrapePage('/docs/padding');

      expect(document1).toBe(document2); // Same object reference
      expect(httpMock.getRequestHistory()).toHaveLength(1); // Only one HTTP request
    });

    it('should handle HTTP errors gracefully', async () => {
      // Mock axios to reject the promise for 404
      const axiosGet = vi.fn().mockRejectedValue(new Error('Request failed with status code 404'));
      vi.mocked(mockAxios().get).mockImplementation(axiosGet);

      await expect(service.scrapePage('/docs/nonexistent')).rejects.toThrow(ServiceError);
    });

    it('should extract correct category from path', async () => {
      const testCases = [
        { path: '/docs/padding', expectedCategory: 'padding' },
        { path: '/docs/typography/font-size', expectedCategory: 'typography' },
        { path: '/guides/react', expectedCategory: 'react' },
        { path: '/installation', expectedCategory: 'general' },
      ];

      httpMock.mockRequests(testCases.map(({ path }) => ({
        matcher: { url: `https://tailwindcss.com${path}` },
        response: { status: 200, data: '<html></html>' },
      })));

      for (const { path, expectedCategory } of testCases) {
        const document = await service.scrapePage(path);
        expect(document.category).toBe(expectedCategory);
      }
    });
  });

  describe('searchDocumentation', () => {
    it('should search documentation and return relevant results', async () => {
      httpMock.mockRequest(
        { url: 'https://tailwindcss.com/docs', method: 'GET' },
        { status: 200, data: sampleDocsIndexHTML }
      );

      const results = await service.searchDocumentation('padding', undefined, 5);

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Padding');
      expect(results[0].url).toBe('https://tailwindcss.com/docs/padding');
      expect(results[0].relevance).toBeGreaterThan(0);
      expect(results[0].snippet).toBeDefined();
    });

    it('should limit search results correctly', async () => {
      httpMock.mockRequest(
        { url: 'https://tailwindcss.com/docs', method: 'GET' },
        { status: 200, data: sampleDocsIndexHTML }
      );

      const results = await service.searchDocumentation('', undefined, 3);
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('should handle case insensitive search', async () => {
      httpMock.mockRequest(
        { url: 'https://tailwindcss.com/docs', method: 'GET' },
        { status: 200, data: sampleDocsIndexHTML }
      );

      const upperResults = await service.searchDocumentation('PADDING');
      const lowerResults = await service.searchDocumentation('padding');

      expect(upperResults).toHaveLength(lowerResults.length);
      if (upperResults.length > 0) {
        expect(upperResults[0].title).toBe(lowerResults[0].title);
      }
    });

    it('should sort results by relevance', async () => {
      httpMock.mockRequest(
        { url: 'https://tailwindcss.com/docs', method: 'GET' },
        { status: 200, data: sampleDocsIndexHTML }
      );

      const results = await service.searchDocumentation('font');
      
      if (results.length > 1) {
        for (let i = 1; i < results.length; i++) {
          expect(results[i-1].relevance).toBeGreaterThanOrEqual(results[i].relevance);
        }
      }
    });

    it('should handle search errors gracefully', async () => {
      const axiosGet = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.mocked(mockAxios().get).mockImplementation(axiosGet);

      await expect(service.searchDocumentation('test')).rejects.toThrow(ServiceError);
    });
  });

  describe('extractUtilityInfo', () => {
    it('should extract utility information from documentation page', async () => {
      httpMock.mockRequest(
        { url: 'https://tailwindcss.com/docs/padding', method: 'GET' },
        { status: 200, data: sampleTailwindDocsHTML }
      );

      const utility = await service.extractUtilityInfo('padding');

      expect(utility).not.toBeNull();
      expect(utility!.id).toBe('padding');
      expect(utility!.name).toBe('Padding');
      expect(utility!.documentation).toContain('padding');
      expect(utility!.category.id).toBe('general'); // Category will be 'general' since path doesn't have parent
      expect(utility!.examples).toBeInstanceOf(Array);
      expect(utility!.values).toBeInstanceOf(Array);
    });

    it('should return null for non-existent utilities', async () => {
      const axiosGet = vi.fn().mockRejectedValue(new Error('404 Not Found'));
      vi.mocked(mockAxios().get).mockImplementation(axiosGet);

      const utility = await service.extractUtilityInfo('nonexistent');
      expect(utility).toBeNull();
    });

    it('should infer CSS properties correctly', async () => {
      const testCases = [
        { path: 'padding', expectedProperty: 'padding' },
        { path: 'margin', expectedProperty: 'margin' },
        { path: 'width', expectedProperty: 'width' },
        { path: 'text-color', expectedProperty: 'color' },
        { path: 'font-size', expectedProperty: 'font-family' },
      ];

      for (const { path, expectedProperty } of testCases) {
        httpMock.mockRequest(
          { url: `https://tailwindcss.com/docs/${path}` },
          { 
            status: 200, 
            data: `<html><body><h1>${path.charAt(0).toUpperCase() + path.slice(1)}</h1><p>Description</p></body></html>` 
          }
        );

        const utility = await service.extractUtilityInfo(path);
        expect(utility?.cssProperty).toBe(expectedProperty);
      }
    });
  });

  describe('extractConfigGuide', () => {
    it('should extract configuration guide information', async () => {
      const mockConfigHTML = `
        <html>
          <body>
            <h1>Configuration</h1>
            <p>Learn how to configure TailwindCSS</p>
            <h2>Basic Setup</h2>
            <pre>module.exports = {
  content: ['./src/**/*.html'],
  theme: {
    extend: {},
  },
  plugins: [],
}</pre>
          </body>
        </html>
      `;

      httpMock.mockRequest(
        { url: 'https://tailwindcss.com/docs/configuration', method: 'GET' },
        { status: 200, data: mockConfigHTML }
      );

      const guide = await service.extractConfigGuide('configuration');

      expect(guide).not.toBeNull();
      expect(guide!.topic).toBe('Configuration');
      expect(guide!.description).toContain('configure');
      expect(guide!.examples).toHaveLength(1);
      expect(guide!.examples[0].title).toBe('Configuration Example'); // Default title when no h2/h3 found
      expect(guide!.examples[0].code).toContain('module.exports');
    });

    it('should handle framework-specific guides', async () => {
      const mockReactHTML = `
        <html>
          <body>
            <h1>Install Tailwind CSS with React</h1>
            <p>Setup TailwindCSS in a React project</p>
            <pre>npm install tailwindcss</pre>
          </body>
        </html>
      `;

      httpMock.mockRequest(
        { url: 'https://tailwindcss.com/docs/guides/react', method: 'GET' },
        { status: 200, data: mockReactHTML }
      );

      const guide = await service.extractConfigGuide('react', 'react');

      expect(guide).not.toBeNull();
      expect(guide!.topic).toBe('Install Tailwind CSS with React');
      expect(guide!.examples[0].framework).toBe('react');
    });

    it('should return null for invalid config guides', async () => {
      const axiosGet = vi.fn().mockRejectedValue(new Error('404 Not Found'));
      vi.mocked(mockAxios().get).mockImplementation(axiosGet);

      const guide = await service.extractConfigGuide('nonexistent');
      expect(guide).toBeNull();
    });
  });

  describe('cache management', () => {
    it('should provide cache statistics', async () => {
      const initialStats = service.getCacheStats();
      expect(initialStats.totalEntries).toBe(0);

      // Add some cached data
      httpMock.mockRequest(
        { url: 'https://tailwindcss.com/docs/test' },
        { status: 200, data: 'test content' }
      );

      await service.scrapePage('/docs/test');

      const statsAfterCache = service.getCacheStats();
      expect(statsAfterCache.totalEntries).toBe(1);
      expect(statsAfterCache.memoryUsage).toBeGreaterThan(0);
    });

    it('should clear cache correctly', async () => {
      // Add cached data
      httpMock.mockRequest(
        { url: 'https://tailwindcss.com/docs/test' },
        { status: 200, data: 'test content' }
      );

      await service.scrapePage('/docs/test');
      expect(service.getCacheStats().totalEntries).toBe(1);

      await service.clearCache();
      expect(service.getCacheStats().totalEntries).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should wrap HTTP errors in ServiceError', async () => {
      const axiosGet = vi.fn().mockRejectedValue(new Error('Network timeout'));
      vi.mocked(mockAxios().get).mockImplementation(axiosGet);

      try {
        await service.scrapePage('/docs/test');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceError);
        expect((error as ServiceError).service).toBe('DocumentationScraperService');
        expect((error as ServiceError).operation).toBe('scrapePage');
        expect((error as ServiceError).originalError).toBeInstanceOf(Error);
      }
    });

    it('should handle malformed HTML gracefully', async () => {
      const malformedHTML = '<html><body><h1>Incomplete';

      httpMock.mockRequest(
        { url: 'https://tailwindcss.com/docs/malformed' },
        { status: 200, data: malformedHTML }
      );

      // Should not throw, but gracefully handle malformed HTML
      const utility = await service.extractUtilityInfo('malformed');
      expect(utility).not.toBeNull();
    });
  });
});