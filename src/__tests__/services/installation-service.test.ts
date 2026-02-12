/**
 * Tests for InstallationService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InstallationService } from '../../services/installation-service.js';
import { ServiceError } from '../../services/base.js';
import type { InstallTailwindParams } from '../../types/index.js';

describe('InstallationService', () => {
  let installationService: InstallationService;

  beforeEach(() => {
    installationService = new InstallationService();
  });

  describe('initialization', () => {
    it('should initialize without errors', async () => {
      await expect(installationService.initialize()).resolves.not.toThrow();
    });

    it('should cleanup without errors', async () => {
      await installationService.initialize();
      await expect(installationService.cleanup()).resolves.not.toThrow();
    });
  });

  describe('getSupportedFrameworks', () => {
    beforeEach(async () => {
      await installationService.initialize();
    });

    it('should return supported frameworks', () => {
      const frameworks = installationService.getSupportedFrameworks();

      expect(frameworks).toContain('react');
      expect(frameworks).toContain('nextjs');
      expect(frameworks).toContain('vue');
      expect(frameworks).toContain('vite');
      expect(frameworks).toContain('laravel');
      expect(frameworks).toContain('angular');
      expect(frameworks).toContain('svelte');
    });

    it('should return frameworks in lowercase', () => {
      const frameworks = installationService.getSupportedFrameworks();

      frameworks.forEach(framework => {
        expect(framework).toBe(framework.toLowerCase());
      });
    });
  });

  describe('generateInstallationGuide (v3)', () => {
    beforeEach(async () => {
      await installationService.initialize();
    });

    describe('React framework', () => {
      it('should generate installation guide for React with npm', async () => {
        const params: InstallTailwindParams = {
          framework: 'react',
          packageManager: 'npm',
          includeTypescript: false,
          version: 'v3'
        };

        const guide = await installationService.generateInstallationGuide(params);

        expect(guide).toHaveProperty('commands');
        expect(guide).toHaveProperty('configFiles');
        expect(guide).toHaveProperty('nextSteps');
        expect(guide.version).toBe('v3');

        expect(guide.commands).toContain('npm install -D tailwindcss autoprefixer postcss');
        expect(guide.commands).toContain('npx tailwindcss init -p');

        expect(guide.configFiles).toHaveLength(3); // tailwind.config.js, postcss.config.js, src/index.css
        expect(guide.configFiles.some(file => file.filename === 'tailwind.config.js')).toBe(true);
        expect(guide.configFiles.some(file => file.filename === 'postcss.config.js')).toBe(true);
        expect(guide.configFiles.some(file => file.filename === 'src/index.css')).toBe(true);

        expect(guide.nextSteps).toContain('Update your tailwind.config.js content paths to match your project structure');
        expect(guide.nextSteps).toContain('Import your CSS file in your main component (usually src/index.js or src/App.js)');
      });

      it('should generate installation guide for React with TypeScript', async () => {
        const params: InstallTailwindParams = {
          framework: 'react',
          packageManager: 'npm',
          includeTypescript: true,
          version: 'v3'
        };

        const guide = await installationService.generateInstallationGuide(params);

        expect(guide.commands).toContain('npm install -D tailwindcss autoprefixer postcss @types/node');
        expect(guide.configFiles.some(file => file.filename === 'tailwind.config.ts')).toBe(true);
        expect(guide.configFiles.find(file => file.filename === 'tailwind.config.ts')?.content).toContain('import type { Config } from "tailwindcss"');
      });

      it('should generate installation guide for React with yarn', async () => {
        const params: InstallTailwindParams = {
          framework: 'react',
          packageManager: 'yarn',
          version: 'v3'
        };

        const guide = await installationService.generateInstallationGuide(params);

        expect(guide.commands).toContain('yarn add -D tailwindcss autoprefixer postcss');
      });

      it('should generate installation guide for React with pnpm', async () => {
        const params: InstallTailwindParams = {
          framework: 'react',
          packageManager: 'pnpm',
          version: 'v3'
        };

        const guide = await installationService.generateInstallationGuide(params);

        expect(guide.commands).toContain('pnpm add -D tailwindcss autoprefixer postcss');
      });

      it('should generate installation guide for React with bun', async () => {
        const params: InstallTailwindParams = {
          framework: 'react',
          packageManager: 'bun',
          version: 'v3'
        };

        const guide = await installationService.generateInstallationGuide(params);

        expect(guide.commands).toContain('bun add -D tailwindcss autoprefixer postcss');
      });
    });

    describe('Next.js framework', () => {
      it('should generate installation guide for Next.js', async () => {
        const params: InstallTailwindParams = {
          framework: 'nextjs',
          packageManager: 'npm',
          version: 'v3'
        };

        const guide = await installationService.generateInstallationGuide(params);

        const configFile = guide.configFiles.find(file => file.filename === 'tailwind.config.js');
        expect(configFile?.content).toContain('./pages/**/*.{js,ts,jsx,tsx,mdx}');
        expect(configFile?.content).toContain('./components/**/*.{js,ts,jsx,tsx,mdx}');
        expect(configFile?.content).toContain('./app/**/*.{js,ts,jsx,tsx,mdx}');

        expect(guide.nextSteps).toContain('If using the app directory, make sure to import CSS in app/layout.js');
        expect(guide.nextSteps).toContain('Import your CSS file in pages/_app.js or app/layout.js');
      });
    });

    describe('Configuration files', () => {
      it('should generate proper tailwind.config.js content', async () => {
        const params: InstallTailwindParams = {
          framework: 'react',
          includeTypescript: false,
          version: 'v3'
        };

        const guide = await installationService.generateInstallationGuide(params);
        const configFile = guide.configFiles.find(file => file.filename === 'tailwind.config.js');

        expect(configFile?.content).toContain('module.exports = {');
        expect(configFile?.content).toContain('content: [');
        expect(configFile?.content).toContain('./src/**/*.{js,jsx,ts,tsx}');
        expect(configFile?.content).toContain('theme: {');
        expect(configFile?.content).toContain('extend: {},');
        expect(configFile?.content).toContain('plugins: [],');
      });

      it('should generate proper tailwind.config.ts content for TypeScript', async () => {
        const params: InstallTailwindParams = {
          framework: 'react',
          includeTypescript: true,
          version: 'v3'
        };

        const guide = await installationService.generateInstallationGuide(params);
        const configFile = guide.configFiles.find(file => file.filename === 'tailwind.config.ts');

        expect(configFile?.content).toContain('import type { Config } from "tailwindcss"');
        expect(configFile?.content).toContain('const config: Config = {');
        expect(configFile?.content).toContain('export default config;');
      });

      it('should generate proper PostCSS config content', async () => {
        const params: InstallTailwindParams = {
          framework: 'react',
          version: 'v3'
        };

        const guide = await installationService.generateInstallationGuide(params);
        const postcssFile = guide.configFiles.find(file => file.filename === 'postcss.config.js');

        expect(postcssFile?.content).toContain('module.exports = {');
        expect(postcssFile?.content).toContain('plugins: {');
        expect(postcssFile?.content).toContain('"tailwindcss"');
        expect(postcssFile?.content).toContain('"autoprefixer"');
      });

      it('should generate proper CSS content', async () => {
        const params: InstallTailwindParams = {
          framework: 'react',
          version: 'v3'
        };

        const guide = await installationService.generateInstallationGuide(params);
        const cssFile = guide.configFiles.find(file => file.filename === 'src/index.css');

        expect(cssFile?.content).toContain('@tailwind base;');
        expect(cssFile?.content).toContain('@tailwind components;');
        expect(cssFile?.content).toContain('@tailwind utilities;');
      });
    });

    describe('Default values', () => {
      it('should use npm as default package manager', async () => {
        const params: InstallTailwindParams = {
          framework: 'react',
          version: 'v3'
        };

        const guide = await installationService.generateInstallationGuide(params);
        expect(guide.commands).toContain('npm install -D tailwindcss autoprefixer postcss');
      });

      it('should use JavaScript config by default', async () => {
        const params: InstallTailwindParams = {
          framework: 'react',
          version: 'v3'
        };

        const guide = await installationService.generateInstallationGuide(params);
        expect(guide.configFiles.some(file => file.filename === 'tailwind.config.js')).toBe(true);
        expect(guide.configFiles.some(file => file.filename === 'tailwind.config.ts')).toBe(false);
      });
    });
  });

  describe('generateInstallationGuide (v4)', () => {
    beforeEach(async () => {
      await installationService.initialize();
    });

    it('should generate v4 installation guide for React with npm', async () => {
      const params: InstallTailwindParams = {
        framework: 'react',
        packageManager: 'npm',
        version: 'v4'
      };

      const guide = await installationService.generateInstallationGuide(params);

      expect(guide.version).toBe('v4');
      expect(guide.commands).toContain('npm install -D tailwindcss @tailwindcss/postcss');
      // v4 has no init command
      expect(guide.commands).not.toContain('npx tailwindcss init -p');
      expect(guide.commands).toHaveLength(1);
    });

    it('should not generate tailwind.config.js for v4', async () => {
      const params: InstallTailwindParams = {
        framework: 'react',
        version: 'v4'
      };

      const guide = await installationService.generateInstallationGuide(params);

      expect(guide.configFiles.some(file => file.filename.startsWith('tailwind.config'))).toBe(false);
    });

    it('should generate @import CSS entry for v4', async () => {
      const params: InstallTailwindParams = {
        framework: 'react',
        version: 'v4'
      };

      const guide = await installationService.generateInstallationGuide(params);
      const cssFile = guide.configFiles.find(file => file.filename === 'src/index.css');

      expect(cssFile?.content).toBe('@import "tailwindcss";');
      expect(cssFile?.content).not.toContain('@tailwind');
    });

    it('should use @tailwindcss/postcss plugin for v4', async () => {
      const params: InstallTailwindParams = {
        framework: 'react',
        version: 'v4'
      };

      const guide = await installationService.generateInstallationGuide(params);
      const postcssFile = guide.configFiles.find(file => file.filename === 'postcss.config.js');

      expect(postcssFile?.content).toContain('@tailwindcss/postcss');
      expect(postcssFile?.content).not.toContain('"autoprefixer"');
    });

    it('should have v4 config files: postcss + css only (no tailwind.config)', async () => {
      const params: InstallTailwindParams = {
        framework: 'react',
        version: 'v4'
      };

      const guide = await installationService.generateInstallationGuide(params);

      // Should have postcss.config.js and src/index.css but NOT tailwind.config.js
      expect(guide.configFiles).toHaveLength(2);
      expect(guide.configFiles.some(file => file.filename === 'postcss.config.js')).toBe(true);
      expect(guide.configFiles.some(file => file.filename === 'src/index.css')).toBe(true);
    });

    it('should suggest @theme customization instead of tailwind.config.js for v4', async () => {
      const params: InstallTailwindParams = {
        framework: 'react',
        version: 'v4'
      };

      const guide = await installationService.generateInstallationGuide(params);

      expect(guide.nextSteps).toContain('Customize your design tokens using @theme in your CSS file');
      expect(guide.nextSteps).not.toContain('Update your tailwind.config.js content paths to match your project structure');
    });

    it('should handle all package managers for v4', async () => {
      const packageManagers = ['npm', 'yarn', 'pnpm', 'bun'] as const;

      for (const pm of packageManagers) {
        const params: InstallTailwindParams = {
          framework: 'react',
          packageManager: pm,
          version: 'v4'
        };

        const guide = await installationService.generateInstallationGuide(params);
        const installCommand = guide.commands[0];
        expect(installCommand).toContain('tailwindcss');
        expect(installCommand).toContain('@tailwindcss/postcss');
        expect(installCommand).not.toContain('autoprefixer');
      }
    });

    it('should default to v4 when no version specified', async () => {
      const params: InstallTailwindParams = {
        framework: 'react',
        packageManager: 'npm'
      };

      const guide = await installationService.generateInstallationGuide(params);

      expect(guide.version).toBe('v4');
      expect(guide.commands).toContain('npm install -D tailwindcss @tailwindcss/postcss');
    });
  });

  describe('Error handling', () => {
    beforeEach(async () => {
      await installationService.initialize();
    });

    it('should throw ServiceError for unsupported framework', async () => {
      const params: InstallTailwindParams = {
        framework: 'unsupported-framework'
      };

      await expect(installationService.generateInstallationGuide(params))
        .rejects.toThrow(ServiceError);

      await expect(installationService.generateInstallationGuide(params))
        .rejects.toThrow('Unsupported framework: unsupported-framework');
    });

    it('should handle case-insensitive framework names', async () => {
      const params: InstallTailwindParams = {
        framework: 'REACT',
        version: 'v3'
      };

      const guide = await installationService.generateInstallationGuide(params);
      expect(guide.commands).toContain('npm install -D tailwindcss autoprefixer postcss');
    });
  });

  describe('edge cases', () => {
    beforeEach(async () => {
      await installationService.initialize();
    });

    it('should handle empty framework string', async () => {
      const params: InstallTailwindParams = {
        framework: ''
      };

      await expect(installationService.generateInstallationGuide(params))
        .rejects.toThrow(ServiceError);
    });

    it('should handle whitespace-only framework string', async () => {
      const params: InstallTailwindParams = {
        framework: '   '
      };

      await expect(installationService.generateInstallationGuide(params))
        .rejects.toThrow(ServiceError);
    });

    it('should handle framework with mixed case', async () => {
      const params: InstallTailwindParams = {
        framework: 'ReAcT',
        version: 'v3'
      };

      const guide = await installationService.generateInstallationGuide(params);
      expect(guide.commands).toContain('npm install -D tailwindcss autoprefixer postcss');
    });
  });
});
