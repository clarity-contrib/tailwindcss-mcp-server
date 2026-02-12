/**
 * Comprehensive tests for TailwindCSSServer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the services module first
vi.mock('../services/index.js', () => {
  const mockDocumentationScraper = {
    searchDocumentation: vi.fn(),
    getConfigGuide: vi.fn(),
    initialize: vi.fn().mockResolvedValue(undefined),
  };

  const mockUtilityMapper = {
    getUtilities: vi.fn(),
    getColors: vi.fn(),
    initialize: vi.fn().mockResolvedValue(undefined),
  };

  return {
    initializeServices: vi.fn().mockResolvedValue({
      documentationScraper: mockDocumentationScraper,
      utilityMapper: mockUtilityMapper,
    }),
  };
});

import { TailwindCSSServer } from '../index.js';

describe('TailwindCSSServer', () => {
  let server: TailwindCSSServer;
  let mockDocumentationScraper: any;
  let mockUtilityMapper: any;

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Create server instance
    server = new TailwindCSSServer();
    await server.initialize();

    // Get references to the mocked services
    mockDocumentationScraper = server['documentationScraper'];
    mockUtilityMapper = server['utilityMapper'];
  });

  afterEach(async () => {
    vi.clearAllMocks();
  });

  describe('Server Initialization', () => {
    it('should initialize server with services', async () => {
      expect(server).toBeDefined();
      expect(server['documentationScraper']).toBeDefined();
      expect(server['utilityMapper']).toBeDefined();
    });

    it('should have services available after initialization', () => {
      expect(mockDocumentationScraper).toBeDefined();
      expect(mockUtilityMapper).toBeDefined();
      expect(typeof mockDocumentationScraper.searchDocumentation).toBe('function');
      expect(typeof mockUtilityMapper.getUtilities).toBe('function');
    });
  });

  describe('Handler Methods', () => {
    it('should handle get utilities request correctly', async () => {
      const mockUtilities = [
        {
          id: 'margin-1',
          name: 'm-1',
          category: { id: 'spacing', name: 'Spacing', description: 'Margin utilities' },
          cssProperty: 'margin',
          values: [{ class: 'm-1', value: '0.25rem' }],
          modifiers: [],
          examples: [],
          documentation: 'Sets margin to 0.25rem',
        },
      ];

      mockUtilityMapper.getUtilities.mockResolvedValue(mockUtilities);

      const result = await server['handleGetTailwindUtilities']({});

      expect(mockUtilityMapper.getUtilities).toHaveBeenCalledWith({ version: 'v4' });
      expect(result.content[0].text).toContain('m-1');
      expect(result.content[0].text).toContain('margin');
    });

    it('should handle get colors request correctly', async () => {
      const mockColors = [
        {
          name: 'blue',
          shades: {
            '500': '#3b82f6',
            '600': '#2563eb',
          },
          usage: ['text-blue-500', 'bg-blue-500'],
        },
      ];

      mockUtilityMapper.getColors.mockResolvedValue(mockColors);

      const result = await server['handleGetTailwindColors']({});

      expect(mockUtilityMapper.getColors).toHaveBeenCalledWith({ version: 'v4' });
      expect(result.content[0].text).toContain('blue');
      expect(result.content[0].text).toContain('#3b82f6');
    });

    it('should handle get config guide request correctly', async () => {
      const mockGuide = {
        topic: 'Installation',
        description: 'How to install TailwindCSS',
        examples: [
          {
            title: 'Basic Installation',
            code: 'npm install tailwindcss',
          },
        ],
        bestPractices: ['Use a build process'],
      };

      mockDocumentationScraper.getConfigGuide.mockResolvedValue(mockGuide);

      const result = await server['handleGetTailwindConfigGuide']({});

      expect(mockDocumentationScraper.getConfigGuide).toHaveBeenCalledWith({ version: 'v4' });
      expect(result.content[0].text).toContain('Installation');
      expect(result.content[0].text).toContain('npm install');
    });

    it('should handle search docs request correctly', async () => {
      const mockResults = [
        {
          title: 'Margin',
          url: 'https://tailwindcss.com/docs/margin',
          snippet: 'Control margin with utilities',
          relevance: 0.8,
        },
      ];

      mockDocumentationScraper.searchDocumentation.mockResolvedValue(mockResults);

      const result = await server['handleSearchTailwindDocs']({ query: 'margin' });

      expect(mockDocumentationScraper.searchDocumentation).toHaveBeenCalledWith({ query: 'margin', version: 'v4' });
      expect(result.content[0].text).toContain('Margin');
      expect(result.content[0].text).toContain('utilities');
    });
  });

  describe('Parameter Validation', () => {
    it('should validate get utilities parameters correctly', async () => {
      mockUtilityMapper.getUtilities.mockResolvedValue([]);

      await server['handleGetTailwindUtilities']({ category: 'spacing', property: 'margin' });

      expect(mockUtilityMapper.getUtilities).toHaveBeenCalledWith({
        category: 'spacing',
        property: 'margin',
        version: 'v4',
      });
    });

    it('should validate get colors parameters correctly', async () => {
      mockUtilityMapper.getColors.mockResolvedValue([]);

      await server['handleGetTailwindColors']({ colorName: 'blue', includeShades: true });

      expect(mockUtilityMapper.getColors).toHaveBeenCalledWith({
        colorName: 'blue',
        includeShades: true,
        version: 'v4',
      });
    });

    it('should validate search docs parameters correctly', async () => {
      mockDocumentationScraper.searchDocumentation.mockResolvedValue([]);

      await server['handleSearchTailwindDocs']({ query: 'test', category: 'layout', limit: 5 });

      expect(mockDocumentationScraper.searchDocumentation).toHaveBeenCalledWith({
        query: 'test',
        category: 'layout',
        limit: 5,
        version: 'v4',
      });
    });

    it('should require query parameter for search', async () => {
      await expect(
        server['handleSearchTailwindDocs']({})
      ).rejects.toThrow('Search query is required');
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockUtilityMapper.getUtilities.mockRejectedValue(new Error('Service error'));

      await expect(
        server['handleGetTailwindUtilities']({})
      ).rejects.toThrow();
    });

    it('should handle null responses from services', async () => {
      mockDocumentationScraper.getConfigGuide.mockResolvedValue(null);

      const result = await server['handleGetTailwindConfigGuide']({});
      
      expect(result.content[0].text).toBe('null');
    });
  });
});