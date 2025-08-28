/**
 * Installation Service for TailwindCSS MCP Server
 * Provides installation guides and configuration generation for different frameworks
 */

import { BaseService, ServiceError } from './base.js';
import type { InstallationGuide, InstallTailwindParams } from '../types/index.js';

export class InstallationService implements BaseService {
  private frameworks: Map<string, FrameworkConfig> = new Map();
  
  async initialize(): Promise<void> {
    this.setupFrameworkConfigs();
  }

  async cleanup(): Promise<void> {
    this.frameworks.clear();
  }

  /**
   * Generate installation guide for a specific framework
   */
  async generateInstallationGuide(params: InstallTailwindParams): Promise<InstallationGuide> {
    try {
      const { framework, packageManager = 'npm', includeTypescript = false } = params;
      
      const frameworkConfig = this.frameworks.get(framework.toLowerCase());
      if (!frameworkConfig) {
        throw new ServiceError(
          `Unsupported framework: ${framework}`,
          'InstallationService',
          'generateInstallationGuide'
        );
      }

      const commands = this.generateCommands(frameworkConfig, packageManager, includeTypescript);
      const configFiles = this.generateConfigFiles(frameworkConfig, includeTypescript);
      const nextSteps = this.generateNextSteps(frameworkConfig, framework);

      return {
        commands,
        configFiles,
        nextSteps
      };
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError(
        'Failed to generate installation guide',
        'InstallationService',
        'generateInstallationGuide',
        error
      );
    }
  }

  /**
   * Get list of supported frameworks
   */
  getSupportedFrameworks(): string[] {
    return Array.from(this.frameworks.keys());
  }

  /**
   * Setup framework configurations
   */
  private setupFrameworkConfigs(): void {
    this.frameworks.set('react', {
      name: 'React',
      dependencies: ['tailwindcss', 'autoprefixer', 'postcss'],
      devDependencies: [],
      contentPaths: ['./src/**/*.{js,jsx,ts,tsx}'],
      cssImport: '@tailwind base;\n@tailwind components;\n@tailwind utilities;',
      hasPostCSS: true,
      setupInstructions: [
        'Import your CSS file in your main component (usually src/index.js or src/App.js)',
        'Start using TailwindCSS classes in your React components'
      ]
    });

    this.frameworks.set('nextjs', {
      name: 'Next.js',
      dependencies: ['tailwindcss', 'autoprefixer', 'postcss'],
      devDependencies: [],
      contentPaths: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}'
      ],
      cssImport: '@tailwind base;\n@tailwind components;\n@tailwind utilities;',
      hasPostCSS: true,
      setupInstructions: [
        'Import your CSS file in pages/_app.js or app/layout.js',
        'Start using TailwindCSS classes in your Next.js components'
      ]
    });

    this.frameworks.set('vue', {
      name: 'Vue.js',
      dependencies: ['tailwindcss', 'autoprefixer', 'postcss'],
      devDependencies: [],
      contentPaths: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
      cssImport: '@tailwind base;\n@tailwind components;\n@tailwind utilities;',
      hasPostCSS: true,
      setupInstructions: [
        'Import your CSS file in src/main.js',
        'Start using TailwindCSS classes in your Vue components'
      ]
    });

    this.frameworks.set('vite', {
      name: 'Vite',
      dependencies: ['tailwindcss', 'autoprefixer', 'postcss'],
      devDependencies: [],
      contentPaths: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
      cssImport: '@tailwind base;\n@tailwind components;\n@tailwind utilities;',
      hasPostCSS: true,
      setupInstructions: [
        'Import your CSS file in src/main.js',
        'Start using TailwindCSS classes in your components'
      ]
    });

    this.frameworks.set('laravel', {
      name: 'Laravel',
      dependencies: ['tailwindcss', 'autoprefixer', 'postcss'],
      devDependencies: [],
      contentPaths: [
        './resources/**/*.blade.php',
        './resources/**/*.js',
        './resources/**/*.vue'
      ],
      cssImport: '@tailwind base;\n@tailwind components;\n@tailwind utilities;',
      hasPostCSS: true,
      setupInstructions: [
        'Add the Tailwind directives to your resources/css/app.css file',
        'Build your assets using Laravel Mix or Vite',
        'Start using TailwindCSS classes in your Blade templates'
      ]
    });

    this.frameworks.set('angular', {
      name: 'Angular',
      dependencies: ['tailwindcss', 'autoprefixer', 'postcss'],
      devDependencies: [],
      contentPaths: ['./src/**/*.{html,ts}'],
      cssImport: '@tailwind base;\n@tailwind components;\n@tailwind utilities;',
      hasPostCSS: false,
      setupInstructions: [
        'Add the Tailwind directives to your src/styles.css file',
        'Start using TailwindCSS classes in your Angular components'
      ]
    });

    this.frameworks.set('svelte', {
      name: 'Svelte',
      dependencies: ['tailwindcss', 'autoprefixer', 'postcss'],
      devDependencies: [],
      contentPaths: ['./src/**/*.{html,js,svelte,ts}'],
      cssImport: '@tailwind base;\n@tailwind components;\n@tailwind utilities;',
      hasPostCSS: true,
      setupInstructions: [
        'Import your CSS file in src/app.html or src/main.js',
        'Start using TailwindCSS classes in your Svelte components'
      ]
    });
  }

  /**
   * Generate installation commands
   */
  private generateCommands(
    config: FrameworkConfig,
    packageManager: string,
    includeTypescript: boolean
  ): string[] {
    const commands: string[] = [];
    
    // Installation command
    const allDeps = [...config.dependencies, ...config.devDependencies];
    if (includeTypescript && !allDeps.includes('@types/node')) {
      allDeps.push('@types/node');
    }

    switch (packageManager) {
      case 'npm':
        commands.push(`npm install -D ${allDeps.join(' ')}`);
        break;
      case 'yarn':
        commands.push(`yarn add -D ${allDeps.join(' ')}`);
        break;
      case 'pnpm':
        commands.push(`pnpm add -D ${allDeps.join(' ')}`);
        break;
      case 'bun':
        commands.push(`bun add -D ${allDeps.join(' ')}`);
        break;
    }

    // Initialize Tailwind config
    commands.push('npx tailwindcss init -p');

    return commands;
  }

  /**
   * Generate configuration files
   */
  private generateConfigFiles(config: FrameworkConfig, includeTypescript: boolean): Array<{ filename: string; content: string }> {
    const configFiles: Array<{ filename: string; content: string }> = [];

    // Tailwind config file
    const configExtension = includeTypescript ? 'ts' : 'js';
    const tailwindConfig = this.generateTailwindConfig(config, includeTypescript);
    configFiles.push({
      filename: `tailwind.config.${configExtension}`,
      content: tailwindConfig
    });

    // PostCSS config (if needed)
    if (config.hasPostCSS) {
      const postcssConfig = this.generatePostCSSConfig();
      configFiles.push({
        filename: 'postcss.config.js',
        content: postcssConfig
      });
    }

    // CSS file
    configFiles.push({
      filename: 'src/index.css',
      content: config.cssImport
    });

    return configFiles;
  }

  /**
   * Generate Tailwind configuration
   */
  private generateTailwindConfig(config: FrameworkConfig, includeTypescript: boolean): string {
    const typeAnnotation = includeTypescript ? ': import("tailwindcss").Config' : '';
    
    return `/** @type {import('tailwindcss').Config} */
${includeTypescript ? 'import type { Config } from "tailwindcss";' : ''}

${includeTypescript ? 'const config: Config = {' : 'module.exports = {'}
  content: [
    ${config.contentPaths.map(path => `"${path}"`).join(',\n    ')}
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}${includeTypescript ? ';\n\nexport default config;' : ''}`;
  }

  /**
   * Generate PostCSS configuration
   */
  private generatePostCSSConfig(): string {
    return `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
  }

  /**
   * Generate next steps instructions
   */
  private generateNextSteps(config: FrameworkConfig, framework: string): string[] {
    const nextSteps = [
      'Update your tailwind.config.js content paths to match your project structure',
      ...config.setupInstructions,
      'Start your development server',
      'Start using TailwindCSS classes',
      'Test TailwindCSS by adding utility classes to your components'
    ];

    // Add framework-specific steps
    if (framework.toLowerCase() === 'nextjs') {
      nextSteps.splice(1, 0, 'If using the app directory, make sure to import CSS in app/layout.js');
    }

    if (framework.toLowerCase() === 'laravel') {
      nextSteps.splice(1, 0, 'Make sure your build process includes the CSS compilation step');
    }

    return nextSteps;
  }
}

interface FrameworkConfig {
  name: string;
  dependencies: string[];
  devDependencies: string[];
  contentPaths: string[];
  cssImport: string;
  hasPostCSS: boolean;
  setupInstructions: string[];
}