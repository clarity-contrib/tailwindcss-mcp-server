/**
 * Documentation Scraper Service for TailwindCSS MCP Server
 * Handles fetching and parsing TailwindCSS documentation
 */

import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { CachedService, ServiceError } from './base.js';
import {
  CachedDocument,
  SearchResult,
  TailwindUtility,
  ConfigGuide,
  ConfigExample,
  ConfigGuideParams,
  SearchDocsParams,
  Example,
  UtilityValue,
  ColorInfo
} from '../types/index.js';
import { getVersionConfig, DEFAULT_VERSION } from '../version/index.js';
import type { TailwindVersion } from '../version/index.js';

export class DocumentationScraperService extends CachedService {
  private axiosInstance: AxiosInstance;
  private readonly USER_AGENT = 'Mozilla/5.0 (compatible; TailwindCSSMcpServer/0.1.0)';

  constructor() {
    super();
    this.axiosInstance = axios.create({
      timeout: 15000,
      headers: {
        'User-Agent': this.USER_AGENT,
      },
    });
  }

  async initialize(): Promise<void> {
    await super.initialize();
    console.error('DocumentationScraperService initialized');
  }

  /**
   * Scrapes and caches a documentation page
   */
  async scrapePage(path: string, version: TailwindVersion = DEFAULT_VERSION): Promise<CachedDocument> {
    const docsBaseUrl = getVersionConfig(version).docsBaseUrl;
    const fullUrl = `${docsBaseUrl}${path}`;
    const cacheKey = this.getCacheKey(fullUrl, version);

    this.updateCacheStats(false);

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && !this.isCacheExpired(cached)) {
      this.updateCacheStats(true);
      return cached;
    }

    try {
      console.error(`[${version}] Scraping documentation page: ${fullUrl}`);
      const response = await this.axiosInstance.get(fullUrl);
      
      const document: CachedDocument = {
        url: fullUrl,
        content: response.data,
        lastUpdated: new Date(),
        category: this.getCategoryFromPath(path),
        metadata: {
          contentType: response.headers['content-type'],
          statusCode: response.status,
        },
      };

      this.cache.set(cacheKey, document);
      return document;

    } catch (error) {
      throw new ServiceError(
        `Failed to scrape documentation page: ${fullUrl}`,
        'DocumentationScraperService',
        'scrapePage',
        error
      );
    }
  }

  /**
   * Searches documentation pages for content matching query (overloaded for params object)
   */
  async searchDocumentation(params: SearchDocsParams): Promise<SearchResult[]>;
  async searchDocumentation(query: string, category?: string, limit?: number, version?: TailwindVersion): Promise<SearchResult[]>;
  async searchDocumentation(queryOrParams: string | SearchDocsParams, category?: string, limit: number = 10, version: TailwindVersion = DEFAULT_VERSION): Promise<SearchResult[]> {
    const query = typeof queryOrParams === 'string' ? queryOrParams : queryOrParams.query;
    const searchCategory = typeof queryOrParams === 'string' ? category : queryOrParams.category;
    const searchLimit = typeof queryOrParams === 'string' ? limit : queryOrParams.limit || 10;
    const searchVersion = typeof queryOrParams === 'string' ? version : queryOrParams.version || DEFAULT_VERSION;
    const docsBaseUrl = getVersionConfig(searchVersion).docsBaseUrl;
    try {
      // For now, implement a simple search by scraping the docs index
      // In a production system, you'd want to build an index
      const docsIndex = await this.scrapePage('/docs', searchVersion);
      const $ = cheerio.load(docsIndex.content);

      const results: SearchResult[] = [];
      const searchQuery = query.toLowerCase();

      // Find all documentation links
      $('a[href^="/docs/"]').each((_, element) => {
        const link = $(element);
        const href = link.attr('href');
        const text = link.text().trim();

        if (href && text) {
          const relevance = this.calculateRelevance(text, searchQuery);
          if (relevance > 0) {
            results.push({
              title: text,
              url: `${docsBaseUrl}${href}`,
              snippet: this.extractSnippet(text, searchQuery),
              relevance,
            });
          }
        }
      });

      // Sort by relevance and limit results
      return results
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, limit);

    } catch (error) {
      throw new ServiceError(
        `Failed to search documentation for query: ${query}`,
        'DocumentationScraperService',
        'searchDocumentation',
        error
      );
    }
  }

  /**
   * Scrapes all TailwindCSS utilities from the documentation
   */
  async scrapeAllUtilities(): Promise<TailwindUtility[]> {
    try {
      console.error('Scraping all TailwindCSS utilities...');
      
      // Get the main docs page to find all utility categories
      const mainDoc = await this.scrapePage('/docs');
      const $ = cheerio.load(mainDoc.content);
      
      const utilities: TailwindUtility[] = [];
      const utilityCategories = [
        'layout', 'flexbox-and-grid', 'spacing', 'sizing', 'typography', 
        'backgrounds', 'borders', 'effects', 'filters', 'tables', 
        'transitions-and-animation', 'transforms', 'interactivity', 'svg', 'accessibility'
      ];

      // Scrape each category
      for (const category of utilityCategories) {
        try {
          const categoryUtilities = await this.scrapeCategoryUtilities(category);
          utilities.push(...categoryUtilities);
        } catch (error) {
          console.warn(`Failed to scrape category ${category}:`, error);
        }
      }

      console.error(`Successfully scraped ${utilities.length} utilities`);
      return utilities;
      
    } catch (error) {
      throw new ServiceError(
        'Failed to scrape all utilities',
        'DocumentationScraperService',
        'scrapeAllUtilities',
        error
      );
    }
  }

  /**
   * Scrapes utilities for a specific category
   */
  private async scrapeCategoryUtilities(category: string): Promise<TailwindUtility[]> {
    const utilities: TailwindUtility[] = [];
    
    try {
      // Try common utility paths
      const utilityPaths = await this.getUtilityPathsForCategory(category);
      
      for (const path of utilityPaths) {
        try {
          const utility = await this.extractUtilityInfo(path);
          if (utility) {
            utilities.push(utility);
          }
        } catch (error) {
          console.warn(`Failed to extract utility info for ${path}:`, error);
        }
      }
      
    } catch (error) {
      console.warn(`Failed to scrape category ${category}:`, error);
    }
    
    return utilities;
  }

  /**
   * Gets utility paths for a specific category
   */
  private async getUtilityPathsForCategory(category: string): Promise<string[]> {
    // This is a simplified implementation - in reality you'd scrape the category page
    // to get all utility pages within that category
    const categoryMappings: Record<string, string[]> = {
      'layout': ['container', 'columns', 'break-after', 'break-before', 'break-inside', 'box-decoration-break', 'box-sizing', 'display', 'float', 'clear', 'isolation', 'object-fit', 'object-position', 'overflow', 'overscroll-behavior', 'position', 'top-right-bottom-left', 'visibility', 'z-index'],
      'spacing': ['padding', 'margin', 'space-between'],
      'sizing': ['width', 'min-width', 'max-width', 'height', 'min-height', 'max-height'],
      'typography': ['font-family', 'font-size', 'font-smoothing', 'font-style', 'font-weight', 'font-variant-numeric', 'letter-spacing', 'line-clamp', 'line-height', 'list-style-image', 'list-style-position', 'list-style-type', 'text-align', 'text-color', 'text-decoration', 'text-decoration-color', 'text-decoration-style', 'text-decoration-thickness', 'text-underline-offset', 'text-transform', 'text-overflow', 'text-wrap', 'text-indent', 'vertical-align', 'whitespace', 'word-break', 'hyphens', 'content'],
      'backgrounds': ['background-attachment', 'background-clip', 'background-color', 'background-origin', 'background-position', 'background-repeat', 'background-size', 'background-image', 'gradient-color-stops'],
      'borders': ['border-radius', 'border-width', 'border-color', 'border-style', 'divide-width', 'divide-color', 'divide-style', 'outline-width', 'outline-color', 'outline-style', 'outline-offset', 'ring-width', 'ring-color', 'ring-offset-width', 'ring-offset-color'],
    };

    return categoryMappings[category] || [];
  }

  /**
   * Extracts utility class information from documentation pages
   */
  async extractUtilityInfo(utilityPath: string): Promise<TailwindUtility | null> {
    try {
      const doc = await this.scrapePage(`/docs/${utilityPath}`);
      const $ = cheerio.load(doc.content);

      // Extract basic information
      const title = $('h1').first().text().trim();
      const description = $('h1').first().next('p').text().trim();

      // Extract examples
      const examples = this.extractCodeExamples($);

      // Extract utility values
      const values = this.extractUtilityValues($);

      // Basic utility info - more detailed parsing would be implemented later
      return {
        id: utilityPath,
        name: title,
        category: {
          id: this.getCategoryFromPath(utilityPath),
          name: this.getCategoryFromPath(utilityPath),
          description: '',
          utilities: [],
        },
        cssProperty: this.inferCSSProperty(title),
        values,
        modifiers: [], // To be implemented
        examples,
        documentation: description,
      };

    } catch (error) {
      console.error(`Failed to extract utility info for ${utilityPath}:`, error);
      return null;
    }
  }

  /**
   * Scrapes all TailwindCSS colors from the documentation
   */
  async scrapeAllColors(): Promise<ColorInfo[]> {
    try {
      console.error('Scraping all TailwindCSS colors...');
      
      // Scrape the colors reference page
      const colorsDoc = await this.scrapePage('/docs/customizing-colors');
      const $ = cheerio.load(colorsDoc.content);
      
      const colors: ColorInfo[] = [];
      
      // TailwindCSS default color palette
      const defaultColors = [
        'slate', 'gray', 'zinc', 'neutral', 'stone', 
        'red', 'orange', 'amber', 'yellow', 'lime', 'green', 
        'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 
        'violet', 'purple', 'fuchsia', 'pink', 'rose'
      ];

      for (const colorName of defaultColors) {
        const colorInfo = await this.extractColorInfo(colorName);
        if (colorInfo) {
          colors.push(colorInfo);
        }
      }

      console.error(`Successfully scraped ${colors.length} colors`);
      return colors;
      
    } catch (error) {
      throw new ServiceError(
        'Failed to scrape all colors',
        'DocumentationScraperService', 
        'scrapeAllColors',
        error
      );
    }
  }

  /**
   * Extracts color information for a specific color
   */
  private async extractColorInfo(colorName: string): Promise<ColorInfo | null> {
    try {
      // TailwindCSS default shades
      const standardShades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
      
      let shades: { [key: string]: string } = {};
      const usage: string[] = [];

      // Generate default color values (approximated - in real implementation these would be scraped)
      const baseColors: Record<string, Record<string, string>> = {
        'slate': {
          '50': '#f8fafc', '100': '#f1f5f9', '200': '#e2e8f0', '300': '#cbd5e1',
          '400': '#94a3b8', '500': '#64748b', '600': '#475569', '700': '#334155',
          '800': '#1e293b', '900': '#0f172a', '950': '#020617'
        },
        'red': {
          '50': '#fef2f2', '100': '#fee2e2', '200': '#fecaca', '300': '#fca5a5',
          '400': '#f87171', '500': '#ef4444', '600': '#dc2626', '700': '#b91c1c',
          '800': '#991b1b', '900': '#7f1d1d', '950': '#450a0a'
        },
        'blue': {
          '50': '#eff6ff', '100': '#dbeafe', '200': '#bfdbfe', '300': '#93c5fd',
          '400': '#60a5fa', '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8',
          '800': '#1e40af', '900': '#1e3a8a', '950': '#172554'
        },
        // Add more default colors as needed
      };

      if (baseColors[colorName]) {
        shades = baseColors[colorName];
      } else {
        // Generate generic shades if not in predefined list
        for (const shade of standardShades) {
          shades[shade] = `var(--color-${colorName}-${shade})`;
        }
      }

      // Generate usage examples
      usage.push(`text-${colorName}-500`, `bg-${colorName}-500`, `border-${colorName}-500`);

      return {
        name: colorName,
        shades,
        usage,
      };

    } catch (error) {
      console.warn(`Failed to extract color info for ${colorName}:`, error);
      return null;
    }
  }

  /**
   * Gets configuration guide based on parameters
   */
  async getConfigGuide(params: ConfigGuideParams): Promise<ConfigGuide | null> {
    return this.extractConfigGuide(params.topic || 'installation', params.framework, params.version);
  }

  /**
   * Extracts configuration guides from documentation
   */
  async extractConfigGuide(topic: string, framework?: string, version: TailwindVersion = DEFAULT_VERSION): Promise<ConfigGuide | null> {
    try {
      const configPath = framework ? `/docs/guides/${framework}` : `/docs/configuration`;
      const doc = await this.scrapePage(configPath, version);
      const $ = cheerio.load(doc.content);

      const title = $('h1').first().text().trim();
      const description = $('h1').first().next('p').text().trim();

      const examples: ConfigExample[] = [];
      $('pre').each((_, element) => {
        const codeBlock = $(element);
        const code = codeBlock.text().trim();
        
        if (code) {
          let title = 'Configuration Example';
          const headingElement = codeBlock.closest('div').prev('h2, h3');
          if (headingElement.length) {
            title = headingElement.text().trim();
          }

          examples.push({
            title,
            code,
            framework,
          });
        }
      });

      return {
        topic: title,
        description,
        examples,
        bestPractices: [], // To be extracted from content
      };

    } catch (error) {
      console.error(`Failed to extract config guide for ${topic}:`, error);
      return null;
    }
  }

  /**
   * Private helper methods
   */
  private getCacheKey(url: string, version: TailwindVersion = DEFAULT_VERSION): string {
    return `doc:${version}:${url}`;
  }

  private getCategoryFromPath(path: string): string {
    const parts = path.split('/').filter(part => part);
    return parts.length > 1 ? parts[1] : 'general';
  }

  private calculateRelevance(text: string, query: string): number {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    if (lowerText === lowerQuery) return 1.0;
    if (lowerText.includes(lowerQuery)) return 0.8;
    if (lowerText.startsWith(lowerQuery)) return 0.6;
    
    // Check for word matches
    const textWords = lowerText.split(/\s+/);
    const queryWords = lowerQuery.split(/\s+/);
    const matchingWords = queryWords.filter(word => 
      textWords.some(textWord => textWord.includes(word))
    );
    
    return matchingWords.length / queryWords.length * 0.4;
  }

  private extractSnippet(text: string, query: string, maxLength: number = 100): string {
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text.substring(0, maxLength);
    
    const start = Math.max(0, index - 20);
    const end = Math.min(text.length, index + query.length + 20);
    
    return text.substring(start, end);
  }

  private extractCodeExamples($: cheerio.CheerioAPI): Example[] {
    const examples: Example[] = [];
    $('pre').each((_, element) => {
      const codeBlock = $(element);
      const code = codeBlock.text().trim();
      
      if (code) {
        let title = 'Example';
        const headingElement = codeBlock.closest('div').prev('h2, h3');
        if (headingElement.length) {
          title = headingElement.text().trim();
        }

        examples.push({
          title,
          code,
          description: `Example: ${title}`,
        });
      }
    });
    
    return examples;
  }

  private extractUtilityValues($: cheerio.CheerioAPI): UtilityValue[] {
    // This is a simplified implementation
    // Real implementation would parse utility reference tables
    return [];
  }

  private inferCSSProperty(utilityName: string): string {
    // Simple mapping - would be expanded with comprehensive utility mapping
    const propertyMap: Record<string, string> = {
      'padding': 'padding',
      'margin': 'margin',
      'width': 'width',
      'height': 'height',
      'color': 'color',
      'background': 'background-color',
      'font': 'font-family',
      'text': 'color',
    };

    const lowerName = utilityName.toLowerCase();
    for (const [key, value] of Object.entries(propertyMap)) {
      if (lowerName.includes(key)) {
        return value;
      }
    }
    
    return 'unknown';
  }
}