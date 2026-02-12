/**
 * Installation Service for TailwindCSS MCP Server
 * Provides installation guides and configuration generation for different frameworks
 */

import { BaseService, ServiceError } from './base.js';
import type { InstallationGuide, InstallTailwindParams } from '../types/index.js';
import { getVersionConfig, DEFAULT_VERSION } from '../version/index.js';
import type { TailwindVersion, TailwindVersionConfig } from '../version/index.js';

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
      const { framework, packageManager = 'npm', includeTypescript = false, version = DEFAULT_VERSION } = params;
      const versionConfig = getVersionConfig(version);

      const frameworkConfig = this.frameworks.get(framework.toLowerCase());
      if (!frameworkConfig) {
        throw new ServiceError(
          `Unsupported framework: ${framework}`,
          'InstallationService',
          'generateInstallationGuide'
        );
      }

      const commands = this.generateCommands(frameworkConfig, packageManager, includeTypescript, versionConfig);
      const configFiles = this.generateConfigFiles(frameworkConfig, includeTypescript, versionConfig);
      const nextSteps = this.generateNextSteps(frameworkConfig, framework, versionConfig);

      return {
        commands,
        configFiles,
        nextSteps,
        version
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
      contentPaths: ['./src/**/*.{js,jsx,ts,tsx}'],
      hasPostCSS: true,
      setupInstructions: [
        'Import your CSS file in your main component (usually src/index.js or src/App.js)',
        'Start using TailwindCSS classes in your React components'
      ]
    });

    this.frameworks.set('nextjs', {
      name: 'Next.js',
      contentPaths: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}'
      ],
      hasPostCSS: true,
      setupInstructions: [
        'Import your CSS file in pages/_app.js or app/layout.js',
        'Start using TailwindCSS classes in your Next.js components'
      ]
    });

    this.frameworks.set('vue', {
      name: 'Vue.js',
      contentPaths: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
      hasPostCSS: true,
      setupInstructions: [
        'Import your CSS file in src/main.js',
        'Start using TailwindCSS classes in your Vue components'
      ]
    });

    this.frameworks.set('vite', {
      name: 'Vite',
      contentPaths: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
      hasPostCSS: true,
      setupInstructions: [
        'Import your CSS file in src/main.js',
        'Start using TailwindCSS classes in your components'
      ]
    });

    this.frameworks.set('laravel', {
      name: 'Laravel',
      contentPaths: [
        './resources/**/*.blade.php',
        './resources/**/*.js',
        './resources/**/*.vue'
      ],
      hasPostCSS: true,
      setupInstructions: [
        'Add the Tailwind directives to your resources/css/app.css file',
        'Build your assets using Laravel Mix or Vite',
        'Start using TailwindCSS classes in your Blade templates'
      ]
    });

    this.frameworks.set('angular', {
      name: 'Angular',
      contentPaths: ['./src/**/*.{html,ts}'],
      hasPostCSS: false,
      setupInstructions: [
        'Add the Tailwind directives to your src/styles.css file',
        'Start using TailwindCSS classes in your Angular components'
      ]
    });

    this.frameworks.set('svelte', {
      name: 'Svelte',
      contentPaths: ['./src/**/*.{html,js,svelte,ts}'],
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
    includeTypescript: boolean,
    versionConfig: TailwindVersionConfig
  ): string[] {
    const commands: string[] = [];

    const allDeps = [...versionConfig.coreDependencies];
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

    if (versionConfig.initCommand) {
      commands.push(versionConfig.initCommand);
    }

    return commands;
  }

  /**
   * Generate configuration files
   */
  private generateConfigFiles(
    config: FrameworkConfig,
    includeTypescript: boolean,
    versionConfig: TailwindVersionConfig
  ): Array<{ filename: string; content: string }> {
    const configFiles: Array<{ filename: string; content: string }> = [];

    // Tailwind config file (only for v3, v4 uses CSS-first config)
    if (versionConfig.configFileRequired) {
      const configExtension = includeTypescript ? 'ts' : 'js';
      const tailwindConfig = versionConfig.generateTailwindConfig(config.contentPaths, includeTypescript);
      configFiles.push({
        filename: `tailwind.config.${configExtension}`,
        content: tailwindConfig
      });
    }

    // PostCSS config (if needed)
    if (config.hasPostCSS) {
      const postcssConfig = this.generatePostCSSConfig(versionConfig);
      configFiles.push({
        filename: 'postcss.config.js',
        content: postcssConfig
      });
    }

    // CSS file
    configFiles.push({
      filename: 'src/index.css',
      content: versionConfig.cssEntryContent
    });

    return configFiles;
  }

  /**
   * Generate PostCSS configuration
   */
  private generatePostCSSConfig(versionConfig: TailwindVersionConfig): string {
    const pluginEntries = Object.entries(versionConfig.postcssPluginConfig)
      .map(([name, _config]) => `    ${JSON.stringify(name)}: {},`)
      .join('\n');

    return `module.exports = {
  plugins: {
${pluginEntries}
  },
}`;
  }

  /**
   * Generate next steps instructions
   */
  private generateNextSteps(config: FrameworkConfig, framework: string, versionConfig: TailwindVersionConfig): string[] {
    const nextSteps: string[] = [];

    if (versionConfig.configFileRequired) {
      nextSteps.push('Update your tailwind.config.js content paths to match your project structure');
    } else {
      nextSteps.push('Customize your design tokens using @theme in your CSS file');
    }

    nextSteps.push(...config.setupInstructions);
    nextSteps.push('Start your development server');
    nextSteps.push('Start using TailwindCSS classes');
    nextSteps.push('Test TailwindCSS by adding utility classes to your components');

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
  contentPaths: string[];
  hasPostCSS: boolean;
  setupInstructions: string[];
}
