/**
 * Integration tests for the new action tools
 * Tests the end-to-end functionality of install_tailwind, convert_css_to_tailwind, 
 * generate_color_palette, and generate_component_template
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TailwindCSSServer } from '../../index.js';
import { ServiceRegistry } from '../../services/base.js';
import { InstallationService } from '../../services/installation-service.js';
import { ConversionService } from '../../services/conversion-service.js';
import { TemplateService } from '../../services/template-service.js';
import { httpMock, mockAxios } from '../mocks/http-mock.js';
import { CallToolRequestSchema, McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxios()),
  },
}));

// Mock @modelcontextprotocol/sdk/server
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => {
  const MockServer = vi.fn(function (this: any) {
    this.setRequestHandler = vi.fn();
    this.onerror = vi.fn();
    this.connect = vi.fn();
    this.close = vi.fn();
  });
  return { Server: MockServer };
});

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn(),
}));

describe('Action Tools Integration Tests', () => {
  let server: TailwindCSSServer;
  let registry: ServiceRegistry;
  let installationService: InstallationService;
  let conversionService: ConversionService;
  let templateService: TemplateService;

  beforeEach(async () => {
    // Clear HTTP mocks
    httpMock.clear();
    
    // Create services
    registry = new ServiceRegistry();
    installationService = new InstallationService();
    conversionService = new ConversionService();
    templateService = new TemplateService();

    // Register services
    registry.register('installationService', installationService);
    registry.register('conversionService', conversionService);
    registry.register('templateService', templateService);

    // Initialize services
    await registry.initializeAll();

    // Create server (but don't initialize to avoid network calls)
    server = new TailwindCSSServer();
  });

  afterEach(() => {
    httpMock.clear();
  });

  describe('install_tailwind integration', () => {
    it('should generate complete installation guide for React', async () => {
      const params = {
        framework: 'react',
        packageManager: 'npm' as const,
        includeTypescript: false
      };

      const guide = await installationService.generateInstallationGuide(params);

      // Verify complete structure
      expect(guide).toMatchObject({
        commands: expect.arrayContaining([
          'npm install -D tailwindcss autoprefixer postcss',
          'npx tailwindcss init -p'
        ]),
        configFiles: expect.arrayContaining([
          expect.objectContaining({
            filename: 'tailwind.config.js',
            content: expect.stringContaining('module.exports')
          }),
          expect.objectContaining({
            filename: 'postcss.config.js',
            content: expect.stringContaining('tailwindcss')
          }),
          expect.objectContaining({
            filename: 'src/index.css',
            content: expect.stringContaining('@tailwind')
          })
        ]),
        nextSteps: expect.arrayContaining([
          expect.stringContaining('Update your tailwind.config.js'),
          expect.stringContaining('Import your CSS file')
        ])
      });
    });

    it('should handle TypeScript projects correctly', async () => {
      const params = {
        framework: 'nextjs',
        packageManager: 'yarn' as const,
        includeTypescript: true
      };

      const guide = await installationService.generateInstallationGuide(params);

      expect(guide.commands).toContain('yarn add -D tailwindcss autoprefixer postcss @types/node');
      
      const tsConfigFile = guide.configFiles.find(file => file.filename === 'tailwind.config.ts');
      expect(tsConfigFile).toBeDefined();
      expect(tsConfigFile?.content).toContain('import type { Config } from "tailwindcss"');
      expect(tsConfigFile?.content).toContain('const config: Config =');
      expect(tsConfigFile?.content).toContain('export default config;');
    });

    it('should provide framework-specific content paths', async () => {
      const testCases = [
        {
          framework: 'react',
          expectedPaths: ['./src/**/*.{js,jsx,ts,tsx}']
        },
        {
          framework: 'nextjs',
          expectedPaths: [
            './pages/**/*.{js,ts,jsx,tsx,mdx}',
            './components/**/*.{js,ts,jsx,tsx,mdx}',
            './app/**/*.{js,ts,jsx,tsx,mdx}'
          ]
        },
        {
          framework: 'vue',
          expectedPaths: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}']
        },
        {
          framework: 'laravel',
          expectedPaths: [
            './resources/**/*.blade.php',
            './resources/**/*.js',
            './resources/**/*.vue'
          ]
        }
      ];

      for (const testCase of testCases) {
        const params = { framework: testCase.framework };
        const guide = await installationService.generateInstallationGuide(params);
        const configFile = guide.configFiles.find(file => file.filename.includes('tailwind.config'));
        
        testCase.expectedPaths.forEach(path => {
          expect(configFile?.content).toContain(`"${path}"`);
        });
      }
    });

    it('should handle all supported package managers', async () => {
      const packageManagers = ['npm', 'yarn', 'pnpm', 'bun'] as const;
      const framework = 'react';

      for (const pm of packageManagers) {
        const params = { framework, packageManager: pm };
        const guide = await installationService.generateInstallationGuide(params);
        
        const installCommand = guide.commands.find(cmd => cmd.includes('tailwindcss'));
        expect(installCommand).toContain(`${pm} ${pm === 'npm' ? 'install' : 'add'} -D`);
      }
    });
  });

  describe('convert_css_to_tailwind integration', () => {
    it('should convert complex CSS to TailwindCSS utilities', async () => {
      const css = `
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          margin-bottom: 2rem;
          background-color: #f3f4f6;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .button {
          padding: 0.5rem 1rem;
          font-weight: 600;
          color: #ffffff;
          background-color: #3b82f6;
          border-radius: 0.25rem;
          border: none;
        }
      `;

      const result = await conversionService.convertCSS({ css });

      // Should contain expected utility classes
      expect(result.tailwindClasses).toContain('flex');
      expect(result.tailwindClasses).toContain('justify-between');
      expect(result.tailwindClasses).toContain('items-center');
      expect(result.tailwindClasses).toContain('py-4'); // 1rem vertical padding
      expect(result.tailwindClasses).toContain('px-8'); // 2rem horizontal padding
      expect(result.tailwindClasses).toContain('mb-8'); // 2rem margin-bottom
      expect(result.tailwindClasses).toContain('font-semibold'); // 600 weight

      // Should handle unsupported properties
      expect(result.unsupportedStyles?.length).toBeGreaterThan(0);
      expect(result.unsupportedStyles).toContain('box-shadow: 0 1px 3px rgba(0,0,0,0.1)');
    });

    it('should support different output modes', async () => {
      const css = '.test { display: flex; justify-content: center; }';

      const classesResult = await conversionService.convertCSS({ css, mode: 'classes' });
      expect(classesResult.tailwindClasses).toBe('flex justify-center');

      const inlineResult = await conversionService.convertCSS({ css, mode: 'inline' });
      expect(inlineResult.tailwindClasses).toBe('class="flex justify-center"');

      const componentResult = await conversionService.convertCSS({ css, mode: 'component' });
      expect(componentResult.tailwindClasses).toContain('.component {');
      expect(componentResult.tailwindClasses).toContain('@apply flex justify-center;');
    });

    it('should provide helpful suggestions for unsupported styles', async () => {
      const css = `
        .element {
          display: flex;
          custom-property: value;
          border-image: url(image.png);
          margin: 100px; /* Large non-standard value */
        }
      `;

      const result = await conversionService.convertCSS({ css });

      expect(result.suggestions).toContain(
        "Some CSS properties don't have direct TailwindCSS equivalents. Consider using arbitrary values like [property:value]"
      );
      expect(result.suggestions).toContain(
        "Some values are outside Tailwind's default scale. Consider extending your Tailwind config or using arbitrary values"
      );
    });

    it('should handle edge cases gracefully', async () => {
      const testCases = [
        { css: '', expectedClasses: '', expectedSuggestions: ['Provide some CSS to convert'] },
        { css: '   \n\t   ', expectedClasses: '', expectedSuggestions: ['Provide some CSS to convert'] },
        { css: '.element { display: ; }', expectedUnsupported: ['display: '] },
      ];

      for (const testCase of testCases) {
        const result = await conversionService.convertCSS({ css: testCase.css });
        
        if (testCase.expectedClasses !== undefined) {
          expect(result.tailwindClasses).toBe(testCase.expectedClasses);
        }
        
        if (testCase.expectedSuggestions) {
          testCase.expectedSuggestions.forEach(suggestion => {
            expect(result.suggestions).toContain(suggestion);
          });
        }
        
        if (testCase.expectedUnsupported) {
          testCase.expectedUnsupported.forEach(unsupported => {
            expect(result.unsupportedStyles).toContain(unsupported);
          });
        }
      }
    });
  });

  describe('generate_color_palette integration', () => {
    it('should generate complete color palette from hex color', async () => {
      const params = {
        baseColor: '#3B82F6',
        name: 'primary'
      };

      const palette = await templateService.generateColorPalette(params);

      // Verify structure
      expect(palette).toMatchObject({
        name: 'primary',
        colors: expect.objectContaining({
          '50': expect.stringMatching(/^#[0-9A-F]{6}$/i),
          '100': expect.stringMatching(/^#[0-9A-F]{6}$/i),
          '500': expect.stringMatching(/^#[0-9A-F]{6}$/i),
          '900': expect.stringMatching(/^#[0-9A-F]{6}$/i),
          '950': expect.stringMatching(/^#[0-9A-F]{6}$/i),
        }),
        cssVariables: expect.stringContaining(':root {'),
        tailwindConfig: expect.stringContaining('module.exports = {')
      });

      // Verify CSS variables format
      expect(palette.cssVariables).toContain('--color-primary-500:');
      expect(palette.cssVariables).toContain('--color-primary-50:');
      expect(palette.cssVariables).toContain('}');

      // Verify Tailwind config format
      expect(palette.tailwindConfig).toContain('colors: {');
      expect(palette.tailwindConfig).toContain('primary: {');
      expect(palette.tailwindConfig).toContain("'500':");
    });

    it('should support different color input formats', async () => {
      const testCases = [
        { baseColor: '#3B82F6', name: 'hex6' },
        { baseColor: '#36F', name: 'hex3' },
        { baseColor: 'rgb(59, 130, 246)', name: 'rgb' },
        { baseColor: 'rgba(59, 130, 246, 0.8)', name: 'rgba' },
        { baseColor: 'hsl(217, 91%, 60%)', name: 'hsl' },
      ];

      for (const testCase of testCases) {
        const palette = await templateService.generateColorPalette(testCase);
        
        expect(palette.name).toBe(testCase.name);
        expect(Object.keys(palette.colors)).toHaveLength(11); // Default shades
        
        // All colors should be valid hex
        Object.values(palette.colors).forEach(color => {
          expect(color).toMatch(/^#[0-9A-F]{6}$/i);
        });
      }
    });

    it('should generate custom shade ranges', async () => {
      const params = {
        baseColor: '#3B82F6',
        name: 'custom',
        shades: [100, 300, 500, 700, 900]
      };

      const palette = await templateService.generateColorPalette(params);

      expect(Object.keys(palette.colors)).toEqual(['100', '300', '500', '700', '900']);
      expect(palette.cssVariables).toContain('--color-custom-100:');
      expect(palette.cssVariables).toContain('--color-custom-500:');
      expect(palette.cssVariables).toContain('--color-custom-900:');
      expect(palette.cssVariables).not.toContain('--color-custom-50:');
    });

    it('should validate color shade progression', async () => {
      const params = {
        baseColor: '#3B82F6',
        name: 'test',
        shades: [100, 500, 900]
      };

      const palette = await templateService.generateColorPalette(params);

      // Convert colors to numeric values for comparison
      const color100 = parseInt(palette.colors['100'].slice(1), 16);
      const color500 = parseInt(palette.colors['500'].slice(1), 16);
      const color900 = parseInt(palette.colors['900'].slice(1), 16);

      // Lighter shades should have higher values, darker shades lower values
      expect(color100).toBeGreaterThan(color500);
      expect(color500).toBeGreaterThan(color900);
    });
  });

  describe('generate_component_template integration', () => {
    it('should generate complete component templates', async () => {
      const componentTypes = ['button', 'card', 'form', 'navbar', 'modal', 'alert', 'badge', 'breadcrumb'];

      for (const componentType of componentTypes) {
        const params = {
          componentType,
          style: 'modern' as const,
          darkMode: false,
          responsive: true
        };

        const template = await templateService.generateComponentTemplate(params);

        // Verify structure
        expect(template).toMatchObject({
          html: expect.stringContaining('<'),
          description: expect.stringContaining(componentType),
          utilities: expect.arrayContaining([expect.any(String)]),
          customizations: expect.arrayContaining([expect.any(String)])
        });

        // Verify HTML is valid-looking
        const expectedTag = componentType === 'navbar' ? 'nav' : componentType === 'breadcrumb' ? 'nav' : (componentType === 'card' || componentType === 'modal' || componentType === 'alert') ? 'div' : componentType === 'badge' ? 'span' : componentType;
        expect(template.html).toContain(`<${expectedTag}`);
        expect(template.html).toContain('class="');

        // Verify utilities are TailwindCSS classes
        template.utilities.forEach(utility => {
          expect(utility).toMatch(/^[a-z-]+(\d+(\.\d+)?|full|auto|center|start|end|between|around|evenly)?$|^[a-z-]+:[a-z-]+(\d+(\.\d+)?|full|auto|center|start|end|between|around|evenly)?$|^[a-z-]+:[a-z-]+-[a-z-]+$|^[a-z-]+:[a-z-]+-[a-z-]+\/\d+$|^[a-z-]+-[a-z-]+\/\d+$|^[a-z-]+-\[[^\]]+\]$|^[a-z-]+:[a-z-]+-\[[^\]]+\]$/);
        });
      }
    });

    it('should support different component styles', async () => {
      const styles = ['minimal', 'modern', 'playful'] as const;
      const componentType = 'button';

      for (const style of styles) {
        const params = { componentType, style };
        const template = await templateService.generateComponentTemplate(params);

        expect(template.description).toContain(`${style} style`);

        switch (style) {
          case 'minimal':
            expect(template.html).toContain('border');
            expect(template.html).toContain('shadow-sm');
            break;
          case 'playful':
            expect(template.html).toContain('gradient');
            expect(template.html).toContain('purple');
            break;
          case 'modern':
            expect(template.html).toContain('bg-primary');
            break;
        }
      }
    });

    it('should apply dark mode classes when requested', async () => {
      const params = {
        componentType: 'card',
        darkMode: true
      };

      const template = await templateService.generateComponentTemplate(params);

      expect(template.description).toContain('dark mode support');
      expect(template.html).toContain('dark:');
    });

    it('should apply responsive classes when requested', async () => {
      const params = {
        componentType: 'navbar',
        responsive: true
      };

      const template = await templateService.generateComponentTemplate(params);

      expect(template.description).toContain('responsive design');
      expect(template.html).toContain('sm:');
      expect(template.html).toContain('md:');
      expect(template.customizations).toContain('Add mobile menu toggle');
    });

    it('should generate contextually appropriate content', async () => {
      const testCases = [
        {
          componentType: 'form',
          expectedContent: ['<form', '<input', '<label', 'type="email"', 'type="text"']
        },
        {
          componentType: 'navbar',
          expectedContent: ['<nav', 'Logo', 'Home', 'About', 'Get Started']
        },
        {
          componentType: 'modal',
          expectedContent: ['Modal Title', 'backdrop-blur', 'Cancel', 'Confirm']
        },
        {
          componentType: 'alert',
          expectedContent: ['Alert Title', '<svg', 'informational alert']
        }
      ];

      for (const testCase of testCases) {
        const params = { componentType: testCase.componentType };
        const template = await templateService.generateComponentTemplate(params);

        testCase.expectedContent.forEach(content => {
          expect(template.html).toContain(content);
        });
      }
    });
  });

  describe('Cross-service integration patterns', () => {
    it('should combine installation guide with component templates', async () => {
      // 1. Generate installation guide for React
      const installParams = {
        framework: 'react',
        packageManager: 'npm' as const,
        includeTypescript: false
      };
      const installGuide = await installationService.generateInstallationGuide(installParams);

      // 2. Generate a component template
      const templateParams = {
        componentType: 'button',
        style: 'modern' as const
      };
      const template = await templateService.generateComponentTemplate(templateParams);

      // 3. Verify they work together
      expect(installGuide.nextSteps).toContain('Start using TailwindCSS classes');
      
      // The template utilities should be compatible with the installed setup
      const hasValidTailwindClasses = template.utilities.every(utility => 
        /^[a-z-]+(\d+(\.\d+)?|full|auto|center|start|end|between|around|evenly)?$|^[a-z-]+:[a-z-]+(\d+(\.\d+)?|full|auto|center|start|end|between|around|evenly)?$|^[a-z-]+:[a-z-]+-[a-z-]+$|^[a-z-]+:[a-z-]+-[a-z-]+\/\d+$|^[a-z-]+-[a-z-]+\/\d+$|^[a-z-]+-\[[^\]]+\]$|^[a-z-]+:[a-z-]+-\[[^\]]+\]$/.test(utility)
      );
      expect(hasValidTailwindClasses).toBe(true);
    });

    it('should convert CSS and then generate equivalent component', async () => {
      // 1. Convert CSS to TailwindCSS
      const css = `
        .button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem 1rem;
          background-color: #3b82f6;
          color: white;
          border-radius: 0.375rem;
        }
      `;
      const conversion = await conversionService.convertCSS({ css });

      // 2. Generate a button component
      const template = await templateService.generateComponentTemplate({
        componentType: 'button'
      });

      // 3. Compare - converted CSS should have similar utilities to generated template
      const conversionUtilities = conversion.tailwindClasses.split(' ');
      const templateUtilities = template.utilities;

      // Both should contain flex utilities
      expect(conversionUtilities).toContain('inline-flex');
      expect(templateUtilities).toContain('inline-flex');

      // Both should contain alignment utilities
      expect(conversionUtilities).toContain('items-center');
      expect(templateUtilities).toContain('items-center');
      expect(conversionUtilities).toContain('justify-center');
      expect(templateUtilities).toContain('justify-center');
    });

    it('should use generated color palette in component template', async () => {
      // 1. Generate a color palette
      const palette = await templateService.generateColorPalette({
        baseColor: '#10B981',
        name: 'success'
      });

      // 2. Generate an alert component (which could use the success color)
      const template = await templateService.generateComponentTemplate({
        componentType: 'alert'
      });

      // 3. Verify the palette could be integrated into the component
      expect(palette.colors['500']).toMatch(/^#[0-9A-F]{6}$/i);
      expect(palette.tailwindConfig).toContain('success: {');
      
      // The template should be structured to accept color customization
      expect(template.customizations).toContain('Change alert type');
      expect(template.html).toContain('blue-'); // Current color that could be replaced
    });
  });

  describe('Error handling integration', () => {
    it('should handle invalid framework gracefully', async () => {
      await expect(installationService.generateInstallationGuide({
        framework: 'invalid-framework'
      })).rejects.toThrow('Unsupported framework');
    });

    it('should handle invalid CSS gracefully', async () => {
      await expect(conversionService.convertCSS({
        css: '.invalid { syntax'
      })).rejects.toThrow('Invalid CSS syntax');
    });

    it('should handle invalid color format gracefully', async () => {
      await expect(templateService.generateColorPalette({
        baseColor: 'not-a-color',
        name: 'test'
      })).rejects.toThrow('Invalid color format');
    });

    it('should handle invalid component type gracefully', async () => {
      await expect(templateService.generateComponentTemplate({
        componentType: 'invalid-component'
      })).rejects.toThrow('Unsupported component type');
    });
  });

  describe('Performance and scalability', () => {
    it('should handle multiple concurrent operations', async () => {
      const operations = [
        installationService.generateInstallationGuide({ framework: 'react' }),
        installationService.generateInstallationGuide({ framework: 'vue' }),
        conversionService.convertCSS({ css: '.test1 { display: flex; }' }),
        conversionService.convertCSS({ css: '.test2 { position: absolute; }' }),
        templateService.generateColorPalette({ baseColor: '#3B82F6', name: 'blue' }),
        templateService.generateColorPalette({ baseColor: '#EF4444', name: 'red' }),
        templateService.generateComponentTemplate({ componentType: 'button' }),
        templateService.generateComponentTemplate({ componentType: 'card' }),
      ];

      const results = await Promise.all(operations);

      // All operations should complete successfully
      expect(results).toHaveLength(8);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result).not.toBeNull();
      });
    });

    it('should maintain consistent output across multiple calls', async () => {
      const params = {
        framework: 'react',
        packageManager: 'npm' as const,
        includeTypescript: false
      };

      // Make multiple calls
      const results = await Promise.all([
        installationService.generateInstallationGuide(params),
        installationService.generateInstallationGuide(params),
        installationService.generateInstallationGuide(params),
      ]);

      // Results should be identical
      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);
    });
  });
});