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
  Example,
  UtilityValue
} from '../types/index.js';

export class DocumentationScraperService extends CachedService {
  private axiosInstance: AxiosInstance;
  private readonly TAILWIND_DOCS_URL = 'https://tailwindcss.com';
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
    console.log('DocumentationScraperService initialized');
  }

  /**
   * Scrapes and caches a documentation page
   */
  async scrapePage(path: string): Promise<CachedDocument> {
    const fullUrl = `${this.TAILWIND_DOCS_URL}${path}`;
    const cacheKey = this.getCacheKey(fullUrl);

    this.updateCacheStats(false);

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && !this.isCacheExpired(cached)) {
      this.updateCacheStats(true);
      return cached;
    }

    try {
      console.log(`Scraping documentation page: ${fullUrl}`);
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
   * Searches documentation pages for content matching query
   */
  async searchDocumentation(query: string, category?: string, limit: number = 10): Promise<SearchResult[]> {
    try {
      // For now, implement a simple search by scraping the docs index
      // In a production system, you'd want to build an index
      const docsIndex = await this.scrapePage('/docs');
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
              url: `${this.TAILWIND_DOCS_URL}${href}`,
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
   * Extracts configuration guides from documentation
   */
  async extractConfigGuide(topic: string, framework?: string): Promise<ConfigGuide | null> {
    try {
      const configPath = framework ? `/docs/guides/${framework}` : `/docs/configuration`;
      const doc = await this.scrapePage(configPath);
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
  private getCacheKey(url: string): string {
    return `doc:${url}`;
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