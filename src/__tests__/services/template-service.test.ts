/**
 * Tests for TemplateService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TemplateService } from '../../services/template-service.js';
import { ServiceError } from '../../services/base.js';
import type { GenerateTemplateParams, GeneratePaletteParams } from '../../types/index.js';

describe('TemplateService', () => {
  let templateService: TemplateService;

  beforeEach(() => {
    templateService = new TemplateService();
  });

  describe('initialization', () => {
    it('should initialize without errors', async () => {
      await expect(templateService.initialize()).resolves.not.toThrow();
    });

    it('should cleanup without errors', async () => {
      await templateService.initialize();
      await expect(templateService.cleanup()).resolves.not.toThrow();
    });
  });

  describe('getAvailableComponents', () => {
    beforeEach(async () => {
      await templateService.initialize();
    });

    it('should return available component types', () => {
      const components = templateService.getAvailableComponents();
      
      expect(components).toContain('button');
      expect(components).toContain('card');
      expect(components).toContain('form');
      expect(components).toContain('navbar');
      expect(components).toContain('modal');
      expect(components).toContain('alert');
      expect(components).toContain('badge');
      expect(components).toContain('breadcrumb');
    });

    it('should return non-empty array', () => {
      const components = templateService.getAvailableComponents();
      expect(components.length).toBeGreaterThan(0);
    });
  });

  describe('generateComponentTemplate', () => {
    beforeEach(async () => {
      await templateService.initialize();
    });

    describe('button component', () => {
      it('should generate modern button template', async () => {
        const params: GenerateTemplateParams = {
          componentType: 'button',
          style: 'modern'
        };

        const template = await templateService.generateComponentTemplate(params);
        
        expect(template).toHaveProperty('html');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('utilities');
        expect(template).toHaveProperty('customizations');

        expect(template.html).toContain('<button');
        expect(template.html).toContain('class="');
        expect(template.html).toContain('Click me');
        expect(template.description).toContain('modern style button');
        expect(template.utilities).toContain('inline-flex');
        expect(template.utilities).toContain('items-center');
        expect(template.customizations).toContain('Change button text');
      });

      it('should generate minimal button template', async () => {
        const params: GenerateTemplateParams = {
          componentType: 'button',
          style: 'minimal'
        };

        const template = await templateService.generateComponentTemplate(params);
        
        expect(template.description).toContain('minimal style button');
        expect(template.html).toContain('border');
        expect(template.html).toContain('shadow-sm');
      });

      it('should generate playful button template', async () => {
        const params: GenerateTemplateParams = {
          componentType: 'button',
          style: 'playful'
        };

        const template = await templateService.generateComponentTemplate(params);
        
        expect(template.description).toContain('playful style button');
        expect(template.html).toContain('gradient');
        expect(template.html).toContain('purple');
        expect(template.html).toContain('pink');
      });

      it('should generate button with dark mode', async () => {
        const params: GenerateTemplateParams = {
          componentType: 'button',
          style: 'modern',
          darkMode: true
        };

        const template = await templateService.generateComponentTemplate(params);
        
        expect(template.description).toContain('with dark mode support');
        expect(template.html).toContain('dark:');
      });

      it('should generate responsive button', async () => {
        const params: GenerateTemplateParams = {
          componentType: 'button',
          responsive: true
        };

        const template = await templateService.generateComponentTemplate(params);
        
        expect(template.description).toContain('responsive design');
        expect(template.html).toContain('sm:');
      });

      it('should use default values', async () => {
        const params: GenerateTemplateParams = {
          componentType: 'button'
        };

        const template = await templateService.generateComponentTemplate(params);
        
        expect(template.description).toContain('modern style button');
        expect(template.description).toContain('responsive design');
        expect(template.description).not.toContain('dark mode support');
      });
    });

    describe('card component', () => {
      it('should generate card template', async () => {
        const params: GenerateTemplateParams = {
          componentType: 'card',
          style: 'modern'
        };

        const template = await templateService.generateComponentTemplate(params);
        
        expect(template.html).toContain('Card Title');
        expect(template.html).toContain('Card description');
        expect(template.html).toContain('rounded-lg');
        expect(template.html).toContain('border');
        expect(template.html).toContain('shadow-sm');
        expect(template.utilities).toContain('rounded-lg');
        expect(template.customizations).toContain('Customize card padding');
      });

      it('should generate minimal card', async () => {
        const params: GenerateTemplateParams = {
          componentType: 'card',
          style: 'minimal'
        };

        const template = await templateService.generateComponentTemplate(params);
        
        expect(template.description).toContain('minimal style card');
        expect(template.html).toContain('border-gray-200');
      });

      it('should generate playful card', async () => {
        const params: GenerateTemplateParams = {
          componentType: 'card',
          style: 'playful'
        };

        const template = await templateService.generateComponentTemplate(params);
        
        expect(template.description).toContain('playful style card');
        expect(template.html).toContain('border-2');
        expect(template.html).toContain('purple');
      });
    });

    describe('form component', () => {
      it('should generate form template', async () => {
        const params: GenerateTemplateParams = {
          componentType: 'form'
        };

        const template = await templateService.generateComponentTemplate(params);
        
        expect(template.html).toContain('<form');
        expect(template.html).toContain('<input');
        expect(template.html).toContain('<textarea');
        expect(template.html).toContain('<label');
        expect(template.html).toContain('type="email"');
        expect(template.html).toContain('type="text"');
        expect(template.html).toContain('type="submit"');
        expect(template.customizations).toContain('Add more form fields');
      });

      it('should generate form with dark mode', async () => {
        const params: GenerateTemplateParams = {
          componentType: 'form',
          darkMode: true
        };

        const template = await templateService.generateComponentTemplate(params);
        
        expect(template.html).toContain('dark:');
        expect(template.description).toContain('dark mode support');
      });
    });

    describe('navbar component', () => {
      it('should generate navbar template', async () => {
        const params: GenerateTemplateParams = {
          componentType: 'navbar'
        };

        const template = await templateService.generateComponentTemplate(params);
        
        expect(template.html).toContain('<nav');
        expect(template.html).toContain('Logo');
        expect(template.html).toContain('Home');
        expect(template.html).toContain('About');
        expect(template.html).toContain('Services');
        expect(template.html).toContain('Contact');
        expect(template.html).toContain('Get Started');
        expect(template.customizations).toContain('Update navigation links');
      });

      it('should generate minimal navbar', async () => {
        const params: GenerateTemplateParams = {
          componentType: 'navbar',
          style: 'minimal'
        };

        const template = await templateService.generateComponentTemplate(params);
        
        expect(template.html).toContain('border-gray-200');
        expect(template.html).toContain('bg-white');
      });

      it('should generate responsive navbar', async () => {
        const params: GenerateTemplateParams = {
          componentType: 'navbar',
          responsive: true
        };

        const template = await templateService.generateComponentTemplate(params);
        
        expect(template.html).toContain('hidden md:flex');
        expect(template.html).toContain('sm:px-6');
        expect(template.html).toContain('lg:px-8');
        expect(template.customizations).toContain('Add mobile menu toggle');
      });
    });

    describe('modal component', () => {
      it('should generate modal template', async () => {
        const params: GenerateTemplateParams = {
          componentType: 'modal'
        };

        const template = await templateService.generateComponentTemplate(params);
        
        expect(template.html).toContain('Modal Title');
        expect(template.html).toContain('Modal description');
        expect(template.html).toContain('backdrop-blur');
        expect(template.html).toContain('fixed');
        expect(template.html).toContain('z-50');
        expect(template.html).toContain('Cancel');
        expect(template.html).toContain('Confirm');
        expect(template.customizations).toContain('Add JavaScript for show/hide');
      });
    });

    describe('alert component', () => {
      it('should generate alert template', async () => {
        const params: GenerateTemplateParams = {
          componentType: 'alert'
        };

        const template = await templateService.generateComponentTemplate(params);
        
        expect(template.html).toContain('Alert Title');
        expect(template.html).toContain('informational alert message');
        expect(template.html).toContain('rounded-lg');
        expect(template.html).toContain('border');
        expect(template.html).toContain('<svg');
        expect(template.customizations).toContain('Change alert type');
      });
    });

    describe('badge component', () => {
      it('should generate badge template', async () => {
        const params: GenerateTemplateParams = {
          componentType: 'badge'
        };

        const template = await templateService.generateComponentTemplate(params);
        
        expect(template.html).toContain('<span');
        expect(template.html).toContain('Badge');
        expect(template.html).toContain('Success');
        expect(template.html).toContain('Error');
        expect(template.html).toContain('Warning');
        expect(template.html).toContain('rounded-full');
        expect(template.customizations).toContain('Change badge colors');
      });
    });

    describe('breadcrumb component', () => {
      it('should generate breadcrumb template', async () => {
        const params: GenerateTemplateParams = {
          componentType: 'breadcrumb'
        };

        const template = await templateService.generateComponentTemplate(params);
        
        expect(template.html).toContain('<nav');
        expect(template.html).toContain('aria-label="Breadcrumb"');
        expect(template.html).toContain('<ol');
        expect(template.html).toContain('Home');
        expect(template.html).toContain('Category');
        expect(template.html).toContain('Current Page');
        expect(template.html).toContain('<svg');
        expect(template.customizations).toContain('Update links and URLs');
      });

      it('should generate playful breadcrumb', async () => {
        const params: GenerateTemplateParams = {
          componentType: 'breadcrumb',
          style: 'playful'
        };

        const template = await templateService.generateComponentTemplate(params);
        
        expect(template.html).toContain('purple');
      });
    });

    describe('error handling', () => {
      beforeEach(async () => {
        await templateService.initialize();
      });

      it('should throw ServiceError for unsupported component type', async () => {
        const params: GenerateTemplateParams = {
          componentType: 'unsupported-component'
        };

        await expect(templateService.generateComponentTemplate(params))
          .rejects.toThrow(ServiceError);
        
        await expect(templateService.generateComponentTemplate(params))
          .rejects.toThrow('Unsupported component type: unsupported-component');
      });

      it('should handle case-insensitive component types', async () => {
        const params: GenerateTemplateParams = {
          componentType: 'BUTTON'
        };

        const template = await templateService.generateComponentTemplate(params);
        expect(template.html).toContain('<button');
      });
    });
  });

  describe('generateColorPalette', () => {
    beforeEach(async () => {
      await templateService.initialize();
    });

    describe('hex color input', () => {
      it('should generate palette from 6-digit hex color', async () => {
        const params: GeneratePaletteParams = {
          baseColor: '#3B82F6',
          name: 'primary'
        };

        const palette = await templateService.generateColorPalette(params);
        
        expect(palette).toHaveProperty('name', 'primary');
        expect(palette).toHaveProperty('colors');
        expect(palette).toHaveProperty('cssVariables');
        expect(palette).toHaveProperty('tailwindConfig');

        expect(palette.colors).toHaveProperty('50');
        expect(palette.colors).toHaveProperty('100');
        expect(palette.colors).toHaveProperty('500');
        expect(palette.colors).toHaveProperty('900');
        expect(palette.colors).toHaveProperty('950');

        // Check that all colors are valid hex colors
        Object.values(palette.colors).forEach(color => {
          expect(color).toMatch(/^#[0-9A-F]{6}$/i);
        });
      });

      it('should generate palette from 3-digit hex color', async () => {
        const params: GeneratePaletteParams = {
          baseColor: '#36F',
          name: 'accent'
        };

        const palette = await templateService.generateColorPalette(params);
        
        expect(palette.name).toBe('accent');
        expect(Object.keys(palette.colors)).toHaveLength(11); // Default shades
        
        Object.values(palette.colors).forEach(color => {
          expect(color).toMatch(/^#[0-9A-F]{6}$/i);
        });
      });
    });

    describe('rgb color input', () => {
      it('should generate palette from rgb color', async () => {
        const params: GeneratePaletteParams = {
          baseColor: 'rgb(59, 130, 246)',
          name: 'blue'
        };

        const palette = await templateService.generateColorPalette(params);
        
        expect(palette.name).toBe('blue');
        expect(Object.keys(palette.colors)).toHaveLength(11);
        
        Object.values(palette.colors).forEach(color => {
          expect(color).toMatch(/^#[0-9A-F]{6}$/i);
        });
      });

      it('should generate palette from rgba color', async () => {
        const params: GeneratePaletteParams = {
          baseColor: 'rgba(59, 130, 246, 0.8)',
          name: 'semi-blue'
        };

        const palette = await templateService.generateColorPalette(params);
        
        expect(palette.name).toBe('semi-blue');
        Object.values(palette.colors).forEach(color => {
          expect(color).toMatch(/^#[0-9A-F]{6}$/i);
        });
      });
    });

    describe('hsl color input', () => {
      it('should generate palette from hsl color', async () => {
        const params: GeneratePaletteParams = {
          baseColor: 'hsl(217, 91%, 60%)',
          name: 'hsl-blue'
        };

        const palette = await templateService.generateColorPalette(params);
        
        expect(palette.name).toBe('hsl-blue');
        Object.values(palette.colors).forEach(color => {
          expect(color).toMatch(/^#[0-9A-F]{6}$/i);
        });
      });
    });

    describe('custom shades', () => {
      it('should generate palette with custom shades', async () => {
        const params: GeneratePaletteParams = {
          baseColor: '#3B82F6',
          name: 'custom',
          shades: [100, 300, 500, 700, 900]
        };

        const palette = await templateService.generateColorPalette(params);
        
        expect(Object.keys(palette.colors)).toEqual(['100', '300', '500', '700', '900']);
        expect(palette.colors).toHaveProperty('100');
        expect(palette.colors).toHaveProperty('300');
        expect(palette.colors).toHaveProperty('500');
        expect(palette.colors).toHaveProperty('700');
        expect(palette.colors).toHaveProperty('900');
      });

      it('should use default shades when not specified', async () => {
        const params: GeneratePaletteParams = {
          baseColor: '#3B82F6',
          name: 'default-shades'
        };

        const palette = await templateService.generateColorPalette(params);
        
        const expectedShades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
        expect(Object.keys(palette.colors).sort()).toEqual(expectedShades.sort());
      });
    });

    describe('output formats', () => {
      it('should generate CSS variables', async () => {
        const params: GeneratePaletteParams = {
          baseColor: '#3B82F6',
          name: 'primary'
        };

        const palette = await templateService.generateColorPalette(params);
        
        expect(palette.cssVariables).toContain(':root {');
        expect(palette.cssVariables).toContain('--color-primary-500:');
        expect(palette.cssVariables).toContain('--color-primary-50:');
        expect(palette.cssVariables).toContain('--color-primary-950:');
        expect(palette.cssVariables).toContain('}');
      });

      it('should generate Tailwind config', async () => {
        const params: GeneratePaletteParams = {
          baseColor: '#3B82F6',
          name: 'brand'
        };

        const palette = await templateService.generateColorPalette(params);
        
        expect(palette.tailwindConfig).toContain('module.exports = {');
        expect(palette.tailwindConfig).toContain('theme: {');
        expect(palette.tailwindConfig).toContain('extend: {');
        expect(palette.tailwindConfig).toContain('colors: {');
        expect(palette.tailwindConfig).toContain('brand: {');
        expect(palette.tailwindConfig).toContain("'500':");
        expect(palette.tailwindConfig).toContain('}');
      });
    });

    describe('color shade generation', () => {
      it('should generate lighter shades correctly', async () => {
        const params: GeneratePaletteParams = {
          baseColor: '#3B82F6',
          name: 'test',
          shades: [50, 500] // Light shade and base
        };

        const palette = await templateService.generateColorPalette(params);
        
        // Shade 50 should be lighter than shade 500
        const shade50 = palette.colors['50'];
        const shade500 = palette.colors['500'];
        
        // Convert to RGB for comparison (simplified check)
        const rgb50 = parseInt(shade50.slice(1), 16);
        const rgb500 = parseInt(shade500.slice(1), 16);
        
        expect(rgb50).toBeGreaterThan(rgb500); // Lighter shade has higher RGB value
      });

      it('should generate darker shades correctly', async () => {
        const params: GeneratePaletteParams = {
          baseColor: '#3B82F6',
          name: 'test',
          shades: [500, 900] // Base and dark shade
        };

        const palette = await templateService.generateColorPalette(params);
        
        // Shade 900 should be darker than shade 500
        const shade500 = palette.colors['500'];
        const shade900 = palette.colors['900'];
        
        // Convert to RGB for comparison (simplified check)
        const rgb500 = parseInt(shade500.slice(1), 16);
        const rgb900 = parseInt(shade900.slice(1), 16);
        
        expect(rgb900).toBeLessThan(rgb500); // Darker shade has lower RGB value
      });
    });

    describe('error handling', () => {
      beforeEach(async () => {
        await templateService.initialize();
      });

      it('should throw ServiceError for invalid color format', async () => {
        const params: GeneratePaletteParams = {
          baseColor: 'invalid-color',
          name: 'test'
        };

        await expect(templateService.generateColorPalette(params))
          .rejects.toThrow(ServiceError);
        
        await expect(templateService.generateColorPalette(params))
          .rejects.toThrow('Invalid color format');
      });

      it('should handle empty color string', async () => {
        const params: GeneratePaletteParams = {
          baseColor: '',
          name: 'test'
        };

        await expect(templateService.generateColorPalette(params))
          .rejects.toThrow(ServiceError);
      });

      it('should handle malformed hex colors', async () => {
        const params: GeneratePaletteParams = {
          baseColor: '#GGG',
          name: 'test'
        };

        await expect(templateService.generateColorPalette(params))
          .rejects.toThrow(ServiceError);
      });

      it('should handle malformed rgb colors', async () => {
        const params: GeneratePaletteParams = {
          baseColor: 'rgb(300, 400, 500)', // Values out of range
          name: 'test'
        };

        // Should fallback to default color
        const palette = await templateService.generateColorPalette(params);
        expect(palette.name).toBe('test');
      });
    });

    describe('edge cases', () => {
      beforeEach(async () => {
        await templateService.initialize();
      });

      it('should handle empty shades array', async () => {
        const params: GeneratePaletteParams = {
          baseColor: '#3B82F6',
          name: 'empty-shades',
          shades: []
        };

        const palette = await templateService.generateColorPalette(params);
        
        expect(Object.keys(palette.colors)).toHaveLength(0);
      });

      it('should handle single shade', async () => {
        const params: GeneratePaletteParams = {
          baseColor: '#3B82F6',
          name: 'single-shade',
          shades: [500]
        };

        const palette = await templateService.generateColorPalette(params);
        
        expect(Object.keys(palette.colors)).toHaveLength(1);
        expect(palette.colors).toHaveProperty('500');
      });

      it('should handle duplicate shades', async () => {
        const params: GeneratePaletteParams = {
          baseColor: '#3B82F6',
          name: 'duplicate-shades',
          shades: [500, 500, 600, 600]
        };

        const palette = await templateService.generateColorPalette(params);
        
        // Should deduplicate automatically due to object keys
        expect(Object.keys(palette.colors)).toHaveLength(2);
        expect(palette.colors).toHaveProperty('500');
        expect(palette.colors).toHaveProperty('600');
      });

      it('should handle very large shade numbers', async () => {
        const params: GeneratePaletteParams = {
          baseColor: '#3B82F6',
          name: 'large-shades',
          shades: [1000, 2000]
        };

        const palette = await templateService.generateColorPalette(params);
        
        expect(palette.colors).toHaveProperty('1000');
        expect(palette.colors).toHaveProperty('2000');
        // Colors should still be valid hex
        Object.values(palette.colors).forEach(color => {
          expect(color).toMatch(/^#[0-9A-F]{6}$/i);
        });
      });
    });
  });
});