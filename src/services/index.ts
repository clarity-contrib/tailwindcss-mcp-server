/**
 * Service exports for TailwindCSS MCP Server
 */

export { BaseService, CacheableService, CachedService, ServiceRegistry, ServiceError } from './base.js';
export { DocumentationScraperService } from './documentation-scraper.js';
export { UtilityMapperService } from './utility-mapper.js';

import { ServiceRegistry } from './base.js';
import { DocumentationScraperService } from './documentation-scraper.js';
import { UtilityMapperService } from './utility-mapper.js';

// Create and export a service registry instance
export const serviceRegistry = new ServiceRegistry();

// Service initialization helper
export async function initializeServices(): Promise<{
  documentationScraper: DocumentationScraperService;
  utilityMapper: UtilityMapperService;
}> {
  const documentationScraper = new DocumentationScraperService();
  const utilityMapper = new UtilityMapperService();

  // Register services
  serviceRegistry.register('documentationScraper', documentationScraper);
  serviceRegistry.register('utilityMapper', utilityMapper);

  // Initialize all services
  await serviceRegistry.initializeAll();

  return {
    documentationScraper,
    utilityMapper,
  };
}