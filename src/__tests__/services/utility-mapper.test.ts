/**
 * Unit tests for UtilityMapperService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UtilityMapperService } from '../../services/utility-mapper.js';
import { ServiceError } from '../../services/base.js';
import { TailwindUtility, ConversionResult } from '../../types/index.js';
import { 
  sampleUtilityData, 
  sampleColorData, 
  sampleCSSConversions, 
  sampleArbitraryCSSConversions 
} from '../fixtures/index.js';

describe('UtilityMapperService', () => {
  let service: UtilityMapperService;

  beforeEach(async () => {
    service = new UtilityMapperService();
    await service.initialize();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const newService = new UtilityMapperService();
      await newService.initialize();
      
      expect(consoleSpy).toHaveBeenCalledWith('UtilityMapperService initialized');
      consoleSpy.mockRestore();
    });

    it('should load utility mappings during initialization', async () => {
      const utilities = service.getUtilitiesByCategory('spacing');
      expect(utilities.length).toBeGreaterThan(0);

      const paddingUtilities = service.getUtilitiesByProperty('padding');
      expect(paddingUtilities.length).toBeGreaterThan(0);
    });

    it('should load color mappings during initialization', async () => {
      const colors = service.getColorInfo();
      expect(colors.length).toBeGreaterThan(0);
      
      const blueColor = service.getColorInfo('blue');
      expect(blueColor.length).toBe(1);
      expect(blueColor[0].name).toBe('blue');
    });
  });

  describe('cleanup', () => {
    it('should clear all maps during cleanup', async () => {
      // Verify maps are populated
      expect(service.getUtilitiesByCategory('spacing').length).toBeGreaterThan(0);
      expect(service.getColorInfo().length).toBeGreaterThan(0);

      await service.cleanup();

      // After cleanup, maps should be empty
      expect(service.getUtilitiesByCategory('spacing').length).toBe(0);
      expect(service.getColorInfo().length).toBe(0);
    });
  });

  describe('convertCSSToTailwind', () => {
    it('should convert basic CSS properties to Tailwind classes', async () => {
      const css = `
        .test {
          margin: 1rem;
          padding: 0.5rem;
          display: flex;
        }
      `;

      const result = await service.convertCSSToTailwind(css);

      expect(result.tailwindClasses).toContain('m-4'); // 1rem = m-4
      expect(result.tailwindClasses).toContain('p-2'); // 0.5rem = p-2
      expect(result.tailwindClasses).toContain('flex');
    });

    it('should create arbitrary utilities for unsupported values', async () => {
      const css = `
        .test {
          margin: 1.75rem;
          width: 425px;
        }
      `;

      const result = await service.convertCSSToTailwind(css);

      expect(result.tailwindClasses).toContain('m-[1.75rem]');
      expect(result.tailwindClasses).toContain('w-[425px]');
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
    });

    it('should handle unsupported CSS properties', async () => {
      const css = `
        .test {
          filter: blur(5px);
          clip-path: circle(50%);
        }
      `;

      const result = await service.convertCSSToTailwind(css);

      expect(result.unsupportedStyles).toBeDefined();
      expect(result.unsupportedStyles).toContain('filter: blur(5px)');
      expect(result.unsupportedStyles).toContain('clip-path: circle(50%)');
    });

    it('should handle multiple CSS declarations', async () => {
      const css = `
        .container {
          margin: 0;
          padding: 1rem;
          width: 100%;
          display: block;
        }
        .item {
          margin: 0.25rem;
          height: auto;
        }
      `;

      const result = await service.convertCSSToTailwind(css);

      expect(result.tailwindClasses).toContain('m-0');
      expect(result.tailwindClasses).toContain('p-4');
      expect(result.tailwindClasses).toContain('w-full');
      expect(result.tailwindClasses).toContain('block');
      expect(result.tailwindClasses).toContain('m-1');
      expect(result.tailwindClasses).toContain('h-auto');
    });

    it('should handle malformed CSS gracefully', async () => {
      const css = `
        .test {
          margin: 1rem
          padding 0.5rem;
          invalid-property: value;
        }
      `;

      // Should not throw, but might not convert perfectly
      const result = await service.convertCSSToTailwind(css);
      expect(result).toBeDefined();
      expect(typeof result.tailwindClasses).toBe('string');
    });

    it('should support different conversion modes', async () => {
      const css = '.test { padding: 1rem; }';

      const classesResult = await service.convertCSSToTailwind(css, 'classes');
      const inlineResult = await service.convertCSSToTailwind(css, 'inline');
      const componentResult = await service.convertCSSToTailwind(css, 'component');

      // All should work (implementation details may vary)
      expect(classesResult.tailwindClasses).toBeDefined();
      expect(inlineResult.tailwindClasses).toBeDefined();
      expect(componentResult.tailwindClasses).toBeDefined();
    });

    it('should handle CSS parsing errors', async () => {
      const invalidCSS = '{ this is not valid CSS }';

      await expect(service.convertCSSToTailwind(invalidCSS)).rejects.toThrow(ServiceError);
    });
  });

  describe('utility queries', () => {
    describe('getUtilitiesByCategory', () => {
      it('should return utilities for valid categories', () => {
        const spacingUtilities = service.getUtilitiesByCategory('spacing');
        expect(spacingUtilities.length).toBeGreaterThan(0);
        
        spacingUtilities.forEach(utility => {
          expect(utility.category.id).toBe('spacing');
        });
      });

      it('should return empty array for invalid categories', () => {
        const utilities = service.getUtilitiesByCategory('nonexistent-category');
        expect(utilities).toEqual([]);
      });
    });

    describe('getUtilitiesByProperty', () => {
      it('should return utilities for valid CSS properties', () => {
        const marginUtilities = service.getUtilitiesByProperty('margin');
        expect(marginUtilities.length).toBeGreaterThan(0);
        
        marginUtilities.forEach(utility => {
          expect(utility.cssProperty).toBe('margin');
        });
      });

      it('should return empty array for unsupported properties', () => {
        const utilities = service.getUtilitiesByProperty('nonexistent-property');
        expect(utilities).toEqual([]);
      });

      it('should handle properties mapped to multiple utilities', () => {
        const paddingUtilities = service.getUtilitiesByProperty('padding');
        expect(paddingUtilities.length).toBeGreaterThan(0);
      });
    });

    describe('searchUtilities', () => {
      it('should find utilities by name', () => {
        const results = service.searchUtilities('m-4');
        expect(results.length).toBeGreaterThan(0);
        
        const hasMatchingUtility = results.some(u => u.name.toLowerCase().includes('m-4'));
        expect(hasMatchingUtility).toBe(true);
      });

      it('should find utilities by description', () => {
        const results = service.searchUtilities('padding');
        expect(results.length).toBeGreaterThan(0);
        
        const hasRelevantUtility = results.some(u => 
          u.documentation.toLowerCase().includes('padding') || 
          u.name.toLowerCase().includes('padding')
        );
        expect(hasRelevantUtility).toBe(true);
      });

      it('should be case insensitive', () => {
        const lowerResults = service.searchUtilities('margin');
        const upperResults = service.searchUtilities('MARGIN');
        
        expect(lowerResults.length).toBe(upperResults.length);
      });

      it('should prioritize exact name matches', () => {
        // Add a utility with exact name match
        const results = service.searchUtilities('m-4');
        
        if (results.length > 1) {
          expect(results[0].name.toLowerCase()).toBe('m-4');
        }
      });

      it('should return empty array for no matches', () => {
        const results = service.searchUtilities('nonexistentutilityname123');
        expect(results).toEqual([]);
      });
    });
  });

  describe('color information', () => {
    describe('getColorInfo', () => {
      it('should return all colors when no specific color requested', () => {
        const colors = service.getColorInfo();
        expect(colors.length).toBeGreaterThan(0);
        
        const hasSlate = colors.some(c => c.name === 'slate');
        const hasBlue = colors.some(c => c.name === 'blue');
        expect(hasSlate).toBe(true);
        expect(hasBlue).toBe(true);
      });

      it('should return specific color information', () => {
        const blueColors = service.getColorInfo('blue');
        expect(blueColors).toHaveLength(1);
        expect(blueColors[0].name).toBe('blue');
        expect(blueColors[0].shades).toBeDefined();
        expect(blueColors[0].usage).toBeDefined();
        expect(blueColors[0].usage.length).toBeGreaterThan(0);
      });

      it('should return empty array for nonexistent colors', () => {
        const colors = service.getColorInfo('nonexistent-color');
        expect(colors).toEqual([]);
      });

      it('should include usage examples in color info', () => {
        const slateColors = service.getColorInfo('slate');
        expect(slateColors).toHaveLength(1);
        
        const usage = slateColors[0].usage;
        expect(usage).toContain('text-slate-500');
        expect(usage).toContain('bg-slate-500');
        expect(usage).toContain('border-slate-500');
      });
    });
  });

  describe('arbitrary utility generation', () => {
    it('should generate arbitrary utilities for supported properties', () => {
      const testCases = [
        { property: 'margin', value: '1.5rem', expected: 'm-[1.5rem]' },
        { property: 'padding', value: '10px', expected: 'p-[10px]' },
        { property: 'width', value: '300px', expected: 'w-[300px]' },
        { property: 'height', value: '50vh', expected: 'h-[50vh]' },
        { property: 'font-size', value: '1.1rem', expected: 'text-[1.1rem]' },
        { property: 'color', value: '#ff0000', expected: 'text-[#ff0000]' },
        { property: 'background-color', value: 'rgb(255,0,0)', expected: 'bg-[rgb(255,0,0)]' },
      ];

      testCases.forEach(({ property, value, expected }) => {
        const result = service.generateArbitraryUtility(property, value);
        expect(result).toBe(expected);
      });
    });

    it('should return null for unsupported properties', () => {
      const result = service.generateArbitraryUtility('unsupported-property', 'value');
      expect(result).toBeNull();
    });

    it('should handle values with spaces', () => {
      const result = service.generateArbitraryUtility('font-size', '1.5rem 2');
      expect(result).toBe('text-[1.5rem_2]');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty CSS input', async () => {
      const result = await service.convertCSSToTailwind('');
      expect(result.tailwindClasses).toBe('');
      expect(result.unsupportedStyles).toBeUndefined();
      expect(result.suggestions).toBeUndefined();
    });

    it('should handle CSS with only whitespace', async () => {
      const result = await service.convertCSSToTailwind('   \n   \t   ');
      expect(result.tailwindClasses).toBe('');
    });

    it('should handle CSS with comments', async () => {
      const css = `
        /* This is a comment */
        .test {
          /* Another comment */
          margin: 1rem; /* Inline comment */
        }
      `;

      const result = await service.convertCSSToTailwind(css);
      expect(result.tailwindClasses).toContain('m-4');
    });

    it('should handle very long utility class names', async () => {
      const css = `
        .test {
          margin: 999999px;
        }
      `;

      const result = await service.convertCSSToTailwind(css);
      expect(result.tailwindClasses).toBeDefined();
    });
  });

  describe('performance considerations', () => {
    it('should handle multiple simultaneous conversions', async () => {
      const css1 = '.test1 { margin: 1rem; }';
      const css2 = '.test2 { padding: 0.5rem; }';
      const css3 = '.test3 { width: 100%; }';

      const promises = [
        service.convertCSSToTailwind(css1),
        service.convertCSSToTailwind(css2),
        service.convertCSSToTailwind(css3),
      ];

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      expect(results[0].tailwindClasses).toContain('m-4');
      expect(results[1].tailwindClasses).toContain('p-2');
      expect(results[2].tailwindClasses).toContain('w-full');
    });

    it('should handle large CSS input efficiently', async () => {
      const largeCss = Array.from({ length: 100 }, (_, i) => 
        `.class-${i} { margin: ${i}px; padding: ${i * 2}px; }`
      ).join('\n');

      const startTime = Date.now();
      const result = await service.convertCSSToTailwind(largeCss);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});