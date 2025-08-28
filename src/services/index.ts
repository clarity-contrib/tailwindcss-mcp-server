/**
 * Service exports for TailwindCSS MCP Server
 */

export { BaseService, CacheableService, CachedService, ServiceRegistry, ServiceError } from './base.js';
export { DocumentationScraperService } from './documentation-scraper.js';
export { UtilityMapperService } from './utility-mapper.js';
export { InstallationService } from './installation-service.js';
export { ConversionService } from './conversion-service.js';
export { TemplateService } from './template-service.js';

import { ServiceRegistry } from './base.js';
import { DocumentationScraperService } from './documentation-scraper.js';
import { UtilityMapperService } from './utility-mapper.js';
import { InstallationService } from './installation-service.js';
import { ConversionService } from './conversion-service.js';
import { TemplateService } from './template-service.js';

// Create and export a service registry instance
export const serviceRegistry = new ServiceRegistry();

// Service initialization helper
export async function initializeServices(): Promise<{
  documentationScraper: DocumentationScraperService;
  utilityMapper: UtilityMapperService;
  installationService: InstallationService;
  conversionService: ConversionService;
  templateService: TemplateService;
}> {
  const documentationScraper = new DocumentationScraperService();
  const utilityMapper = new UtilityMapperService();
  const installationService = new InstallationService();
  const conversionService = new ConversionService();
  const templateService = new TemplateService();

  // Register services
  serviceRegistry.register('documentationScraper', documentationScraper);
  serviceRegistry.register('utilityMapper', utilityMapper);
  serviceRegistry.register('installationService', installationService);
  serviceRegistry.register('conversionService', conversionService);
  serviceRegistry.register('templateService', templateService);

  // Initialize all services
  await serviceRegistry.initializeAll();

  return {
    documentationScraper,
    utilityMapper,
    installationService,
    conversionService,
    templateService,
  };
}