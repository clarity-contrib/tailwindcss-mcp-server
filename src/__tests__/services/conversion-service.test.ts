/**
 * Tests for ConversionService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConversionService } from '../../services/conversion-service.js';
import { ServiceError } from '../../services/base.js';
import type { ConvertCSSParams, ConversionResult } from '../../types/index.js';

describe('ConversionService', () => {
  let conversionService: ConversionService;

  beforeEach(() => {
    conversionService = new ConversionService();
  });

  describe('initialization', () => {
    it('should initialize without errors', async () => {
      await expect(conversionService.initialize()).resolves.not.toThrow();
    });

    it('should cleanup without errors', async () => {
      await conversionService.initialize();
      await expect(conversionService.cleanup()).resolves.not.toThrow();
    });
  });

  describe('convertCSS', () => {
    beforeEach(async () => {
      await conversionService.initialize();
    });

    describe('display properties', () => {
      it('should convert display: block', async () => {
        const params: ConvertCSSParams = {
          css: '.element { display: block; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('block');
      });

      it('should convert display: flex', async () => {
        const params: ConvertCSSParams = {
          css: '.element { display: flex; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('flex');
      });

      it('should convert display: none to hidden', async () => {
        const params: ConvertCSSParams = {
          css: '.element { display: none; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('hidden');
      });

      it('should convert display: grid', async () => {
        const params: ConvertCSSParams = {
          css: '.element { display: grid; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('grid');
      });
    });

    describe('position properties', () => {
      it('should convert position: relative', async () => {
        const params: ConvertCSSParams = {
          css: '.element { position: relative; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('relative');
      });

      it('should convert position: absolute', async () => {
        const params: ConvertCSSParams = {
          css: '.element { position: absolute; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('absolute');
      });

      it('should convert position: fixed', async () => {
        const params: ConvertCSSParams = {
          css: '.element { position: fixed; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('fixed');
      });
    });

    describe('spacing properties', () => {
      it('should convert margin with pixel values', async () => {
        const params: ConvertCSSParams = {
          css: '.element { margin: 16px; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('m-4'); // 16px = 1rem = 4 in Tailwind scale
      });

      it('should convert margin-top with rem values', async () => {
        const params: ConvertCSSParams = {
          css: '.element { margin-top: 1rem; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('mt-4');
      });

      it('should convert padding with pixel values', async () => {
        const params: ConvertCSSParams = {
          css: '.element { padding: 8px; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('p-2'); // 8px = 0.5rem = 2 in Tailwind scale
      });

      it('should convert zero values', async () => {
        const params: ConvertCSSParams = {
          css: '.element { margin: 0; padding: 0; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('m-0');
        expect(result.tailwindClasses).toContain('p-0');
      });
    });

    describe('width and height properties', () => {
      it('should convert width with percentage values', async () => {
        const params: ConvertCSSParams = {
          css: '.element { width: 50%; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('w-1/2');
      });

      it('should convert width: 100%', async () => {
        const params: ConvertCSSParams = {
          css: '.element { width: 100%; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('w-full');
      });

      it('should convert width with pixel values', async () => {
        const params: ConvertCSSParams = {
          css: '.element { width: 64px; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('w-16'); // 64px = 4rem = 16 in Tailwind scale
      });

      it('should convert height with pixel values', async () => {
        const params: ConvertCSSParams = {
          css: '.element { height: 32px; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('h-8'); // 32px = 2rem = 8 in Tailwind scale
      });
    });

    describe('typography properties', () => {
      it('should convert font-weight with numeric values', async () => {
        const params: ConvertCSSParams = {
          css: '.element { font-weight: 700; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('font-bold');
      });

      it('should convert font-weight with keyword values', async () => {
        const params: ConvertCSSParams = {
          css: '.element { font-weight: bold; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('font-bold');
      });

      it('should convert text-align properties', async () => {
        const params: ConvertCSSParams = {
          css: '.element { text-align: center; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('text-center');
      });

      it('should convert text-align: justify', async () => {
        const params: ConvertCSSParams = {
          css: '.element { text-align: justify; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('text-justify');
      });
    });

    describe('flexbox properties', () => {
      it('should convert flex-direction: row', async () => {
        const params: ConvertCSSParams = {
          css: '.element { flex-direction: row; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('flex-row');
      });

      it('should convert flex-direction: column', async () => {
        const params: ConvertCSSParams = {
          css: '.element { flex-direction: column; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('flex-col');
      });

      it('should convert justify-content properties', async () => {
        const params: ConvertCSSParams = {
          css: '.element { justify-content: center; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('justify-center');
      });

      it('should convert justify-content: space-between', async () => {
        const params: ConvertCSSParams = {
          css: '.element { justify-content: space-between; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('justify-between');
      });

      it('should convert align-items properties', async () => {
        const params: ConvertCSSParams = {
          css: '.element { align-items: center; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('items-center');
      });
    });

    describe('multiple properties', () => {
      it('should convert multiple CSS properties', async () => {
        const params: ConvertCSSParams = {
          css: '.element { display: flex; justify-content: center; align-items: center; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('flex');
        expect(result.tailwindClasses).toContain('justify-center');
        expect(result.tailwindClasses).toContain('items-center');
      });

      it('should handle complex CSS with multiple selectors', async () => {
        const params: ConvertCSSParams = {
          css: `
            .header { display: flex; justify-content: space-between; }
            .content { padding: 16px; margin: 8px; }
          `
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('flex');
        expect(result.tailwindClasses).toContain('justify-between');
        expect(result.tailwindClasses).toContain('p-4');
        expect(result.tailwindClasses).toContain('m-2');
      });
    });

    describe('output modes', () => {
      const testCSS = '.element { display: flex; justify-content: center; }';

      it('should output classes mode by default', async () => {
        const params: ConvertCSSParams = { css: testCSS };
        const result = await conversionService.convertCSS(params);
        
        expect(result.tailwindClasses).toBe('flex justify-center');
      });

      it('should output classes mode explicitly', async () => {
        const params: ConvertCSSParams = { css: testCSS, mode: 'classes' };
        const result = await conversionService.convertCSS(params);
        
        expect(result.tailwindClasses).toBe('flex justify-center');
      });

      it('should output inline mode', async () => {
        const params: ConvertCSSParams = { css: testCSS, mode: 'inline' };
        const result = await conversionService.convertCSS(params);
        
        expect(result.tailwindClasses).toBe('class="flex justify-center"');
      });

      it('should output component mode', async () => {
        const params: ConvertCSSParams = { css: testCSS, mode: 'component' };
        const result = await conversionService.convertCSS(params);
        
        expect(result.tailwindClasses).toContain('.component {');
        expect(result.tailwindClasses).toContain('@apply flex justify-center;');
        expect(result.tailwindClasses).toContain('}');
      });
    });

    describe('unsupported styles', () => {
      it('should handle unsupported CSS properties', async () => {
        const params: ConvertCSSParams = {
          css: '.element { custom-property: value; border-image: url(image.png); }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.unsupportedStyles).toContain('custom-property: value');
        expect(result.unsupportedStyles).toContain('border-image: url(image.png)');
      });

      it('should provide suggestions for unsupported styles', async () => {
        const params: ConvertCSSParams = {
          css: '.element { custom-property: value; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.suggestions).toContain("Some CSS properties don't have direct TailwindCSS equivalents. Consider using arbitrary values like [property:value]");
      });
    });

    describe('custom utilities', () => {
      it('should suggest custom utilities for non-standard values', async () => {
        const params: ConvertCSSParams = {
          css: '.element { margin: 100px; }' // Large value not in standard Tailwind scale
        };

        const result = await conversionService.convertCSS(params);
        expect(result.customUtilities).toBeDefined();
        expect(result.suggestions).toContain("Some values are outside Tailwind's default scale. Consider extending your Tailwind config or using arbitrary values");
      });
    });

    describe('error handling', () => {
      beforeEach(async () => {
        await conversionService.initialize();
      });

      it('should handle empty CSS input', async () => {
        const params: ConvertCSSParams = { css: '' };
        const result = await conversionService.convertCSS(params);
        
        expect(result.tailwindClasses).toBe('');
        expect(result.suggestions).toContain('Provide some CSS to convert');
      });

      it('should handle whitespace-only CSS', async () => {
        const params: ConvertCSSParams = { css: '   \n\t   ' };
        const result = await conversionService.convertCSS(params);
        
        expect(result.tailwindClasses).toBe('');
        expect(result.suggestions).toContain('Provide some CSS to convert');
      });

      it('should throw ServiceError for invalid CSS syntax', async () => {
        const params: ConvertCSSParams = {
          css: '.element { invalid-syntax }'
        };

        await expect(conversionService.convertCSS(params))
          .rejects.toThrow(ServiceError);
      });

      it('should handle malformed CSS gracefully', async () => {
        const params: ConvertCSSParams = {
          css: '.element { display: ; }' // Empty value
        };

        const result = await conversionService.convertCSS(params);
        expect(result.unsupportedStyles).toContain('display: ');
      });
    });

    describe('edge cases', () => {
      beforeEach(async () => {
        await conversionService.initialize();
      });

      it('should handle CSS with comments', async () => {
        const params: ConvertCSSParams = {
          css: `
            /* This is a comment */
            .element {
              display: flex; /* Another comment */
              justify-content: center;
            }
          `
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('flex');
        expect(result.tailwindClasses).toContain('justify-center');
      });

      it('should handle CSS with media queries', async () => {
        const params: ConvertCSSParams = {
          css: `
            @media (min-width: 768px) {
              .element {
                display: flex;
              }
            }
          `
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('flex');
      });

      it('should handle vendor prefixes', async () => {
        const params: ConvertCSSParams = {
          css: '.element { -webkit-display: flex; display: flex; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('flex');
        expect(result.unsupportedStyles).toContain('-webkit-display: flex');
      });

      it('should handle CSS with pseudo-classes', async () => {
        const params: ConvertCSSParams = {
          css: '.element:hover { display: flex; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('flex');
      });

      it('should handle CSS with pseudo-elements', async () => {
        const params: ConvertCSSParams = {
          css: '.element::before { display: block; }'
        };

        const result = await conversionService.convertCSS(params);
        expect(result.tailwindClasses).toContain('block');
      });
    });

    describe('value conversion accuracy', () => {
      beforeEach(async () => {
        await conversionService.initialize();
      });

      it('should convert common pixel values accurately', async () => {
        const testCases = [
          { css: 'margin: 0px', expected: 'm-0' },
          { css: 'margin: 4px', expected: 'm-1' },
          { css: 'margin: 8px', expected: 'm-2' },
          { css: 'margin: 16px', expected: 'm-4' },
          { css: 'margin: 32px', expected: 'm-8' },
        ];

        for (const testCase of testCases) {
          const params: ConvertCSSParams = {
            css: `.element { ${testCase.css}; }`
          };
          const result = await conversionService.convertCSS(params);
          expect(result.tailwindClasses).toContain(testCase.expected);
        }
      });

      it('should convert common percentage values accurately', async () => {
        const testCases = [
          { css: 'width: 25%', expected: 'w-1/4' },
          { css: 'width: 50%', expected: 'w-1/2' },
          { css: 'width: 75%', expected: 'w-3/4' },
          { css: 'width: 100%', expected: 'w-full' },
          { css: 'width: 33.333333%', expected: 'w-1/3' },
        ];

        for (const testCase of testCases) {
          const params: ConvertCSSParams = {
            css: `.element { ${testCase.css}; }`
          };
          const result = await conversionService.convertCSS(params);
          expect(result.tailwindClasses).toContain(testCase.expected);
        }
      });
    });
  });

  describe('v4 version support', () => {
    let conversionService: ConversionService;

    beforeEach(async () => {
      conversionService = new ConversionService();
      await conversionService.initialize();
    });

    it('should include CSS-first note when component mode is used with v4 (default)', async () => {
      const params: ConvertCSSParams = {
        css: '.element { display: flex; justify-content: center; }',
        mode: 'component'
      };

      const result = await conversionService.convertCSS(params);
      expect(result.suggestions).toContain(
        'TailwindCSS v4 encourages CSS-first configuration. Consider using @theme and CSS custom properties instead of @apply for complex components.'
      );
    });

    it('should have version v4 by default', async () => {
      const params: ConvertCSSParams = {
        css: '.element { display: flex; }'
      };

      const result = await conversionService.convertCSS(params);
      expect(result.version).toBe('v4');
    });

    it('should have version v3 when explicitly specified', async () => {
      const params: ConvertCSSParams = {
        css: '.element { display: flex; }',
        version: 'v3'
      };

      const result = await conversionService.convertCSS(params);
      expect(result.version).toBe('v3');
    });
  });
});