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

  describe('generateInstallationGuide', () => {
    beforeEach(async () => {
      await installationService.initialize();
    });

    describe('React framework', () => {
      it('should generate installation guide for React with npm', async () => {
        const params: InstallTailwindParams = {
          framework: 'react',
          packageManager: 'npm',
          includeTypescript: false
        };

        const guide = await installationService.generateInstallationGuide(params);

        expect(guide).toHaveProperty('commands');
        expect(guide).toHaveProperty('configFiles');
        expect(guide).toHaveProperty('nextSteps');

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
          includeTypescript: true
        };

        const guide = await installationService.generateInstallationGuide(params);

        expect(guide.commands).toContain('npm install -D tailwindcss autoprefixer postcss @types/node');
        expect(guide.configFiles.some(file => file.filename === 'tailwind.config.ts')).toBe(true);
        expect(guide.configFiles.find(file => file.filename === 'tailwind.config.ts')?.content).toContain('import type { Config } from "tailwindcss"');
      });

      it('should generate installation guide for React with yarn', async () => {
        const params: InstallTailwindParams = {
          framework: 'react',
          packageManager: 'yarn'
        };

        const guide = await installationService.generateInstallationGuide(params);

        expect(guide.commands).toContain('yarn add -D tailwindcss autoprefixer postcss');
      });

      it('should generate installation guide for React with pnpm', async () => {
        const params: InstallTailwindParams = {
          framework: 'react',
          packageManager: 'pnpm'
        };

        const guide = await installationService.generateInstallationGuide(params);

        expect(guide.commands).toContain('pnpm add -D tailwindcss autoprefixer postcss');
      });

      it('should generate installation guide for React with bun', async () => {
        const params: InstallTailwindParams = {
          framework: 'react',
          packageManager: 'bun'
        };

        const guide = await installationService.generateInstallationGuide(params);

        expect(guide.commands).toContain('bun add -D tailwindcss autoprefixer postcss');
      });
    });

    describe('Next.js framework', () => {
      it('should generate installation guide for Next.js', async () => {
        const params: InstallTailwindParams = {
          framework: 'nextjs',
          packageManager: 'npm'
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

    describe('Vue framework', () => {
      it('should generate installation guide for Vue', async () => {
        const params: InstallTailwindParams = {
          framework: 'vue',
          packageManager: 'npm'
        };

        const guide = await installationService.generateInstallationGuide(params);

        const configFile = guide.configFiles.find(file => file.filename === 'tailwind.config.js');
        expect(configFile?.content).toContain('./index.html');
        expect(configFile?.content).toContain('./src/**/*.{vue,js,ts,jsx,tsx}');

        expect(guide.nextSteps).toContain('Import your CSS file in src/main.js');
      });
    });

    describe('Laravel framework', () => {
      it('should generate installation guide for Laravel', async () => {
        const params: InstallTailwindParams = {
          framework: 'laravel',
          packageManager: 'npm'
        };

        const guide = await installationService.generateInstallationGuide(params);

        const configFile = guide.configFiles.find(file => file.filename === 'tailwind.config.js');
        expect(configFile?.content).toContain('./resources/**/*.blade.php');
        expect(configFile?.content).toContain('./resources/**/*.js');
        expect(configFile?.content).toContain('./resources/**/*.vue');

        expect(guide.nextSteps).toContain('Make sure your build process includes the CSS compilation step');
        expect(guide.nextSteps).toContain('Add the Tailwind directives to your resources/css/app.css file');
      });
    });

    describe('Angular framework', () => {
      it('should generate installation guide for Angular', async () => {
        const params: InstallTailwindParams = {
          framework: 'angular',
          packageManager: 'npm'
        };

        const guide = await installationService.generateInstallationGuide(params);

        // Angular doesn't use PostCSS config by default
        expect(guide.configFiles.some(file => file.filename === 'postcss.config.js')).toBe(false);

        const configFile = guide.configFiles.find(file => file.filename === 'tailwind.config.js');
        expect(configFile?.content).toContain('./src/**/*.{html,ts}');

        expect(guide.nextSteps).toContain('Add the Tailwind directives to your src/styles.css file');
      });
    });

    describe('Error handling', () => {
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
          framework: 'REACT'
        };

        const guide = await installationService.generateInstallationGuide(params);
        expect(guide.commands).toContain('npm install -D tailwindcss autoprefixer postcss');
      });
    });

    describe('Configuration files', () => {
      it('should generate proper tailwind.config.js content', async () => {
        const params: InstallTailwindParams = {
          framework: 'react',
          includeTypescript: false
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
          includeTypescript: true
        };

        const guide = await installationService.generateInstallationGuide(params);
        const configFile = guide.configFiles.find(file => file.filename === 'tailwind.config.ts');

        expect(configFile?.content).toContain('import type { Config } from "tailwindcss"');
        expect(configFile?.content).toContain('const config: Config = {');
        expect(configFile?.content).toContain('export default config;');
      });

      it('should generate proper PostCSS config content', async () => {
        const params: InstallTailwindParams = {
          framework: 'react'
        };

        const guide = await installationService.generateInstallationGuide(params);
        const postcssFile = guide.configFiles.find(file => file.filename === 'postcss.config.js');

        expect(postcssFile?.content).toContain('module.exports = {');
        expect(postcssFile?.content).toContain('plugins: {');
        expect(postcssFile?.content).toContain('tailwindcss: {},');
        expect(postcssFile?.content).toContain('autoprefixer: {},');
      });

      it('should generate proper CSS content', async () => {
        const params: InstallTailwindParams = {
          framework: 'react'
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
          framework: 'react'
        };

        const guide = await installationService.generateInstallationGuide(params);
        expect(guide.commands).toContain('npm install -D tailwindcss autoprefixer postcss');
      });

      it('should use JavaScript config by default', async () => {
        const params: InstallTailwindParams = {
          framework: 'react'
        };

        const guide = await installationService.generateInstallationGuide(params);
        expect(guide.configFiles.some(file => file.filename === 'tailwind.config.js')).toBe(true);
        expect(guide.configFiles.some(file => file.filename === 'tailwind.config.ts')).toBe(false);
      });
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
        framework: 'ReAcT'
      };

      const guide = await installationService.generateInstallationGuide(params);
      expect(guide.commands).toContain('npm install -D tailwindcss autoprefixer postcss');
    });
  });
});