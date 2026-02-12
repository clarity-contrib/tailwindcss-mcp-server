/**
 * TailwindCSS Version Configuration Module
 * Centralizes all v3/v4 differences so services can consult per-request.
 */

export type TailwindVersion = 'v3' | 'v4';

export const DEFAULT_VERSION: TailwindVersion = 'v4';

export const SUPPORTED_VERSIONS: TailwindVersion[] = ['v3', 'v4'];

export interface TailwindVersionConfig {
  version: TailwindVersion;
  docsBaseUrl: string;
  coreDependencies: string[];
  initCommand: string | null;
  cssEntryContent: string;
  postcssPluginConfig: Record<string, Record<string, unknown>>;
  configFileRequired: boolean;
  generateTailwindConfig: (contentPaths: string[], includeTypescript: boolean) => string;
  renamedUtilities: Map<string, string>;
  paletteConfigFormat: (name: string, colors: Record<string, string>) => string;
}

const v3RenamedUtilities = new Map<string, string>();

const v4RenamedUtilities = new Map<string, string>([
  ['decoration-slice', 'box-decoration-slice'],
  ['decoration-clone', 'box-decoration-clone'],
  ['overflow-ellipsis', 'text-ellipsis'],
  ['flex-shrink', 'shrink'],
  ['flex-shrink-0', 'shrink-0'],
  ['flex-grow', 'grow'],
  ['flex-grow-0', 'grow-0'],
]);

const v3Config: TailwindVersionConfig = {
  version: 'v3',
  docsBaseUrl: 'https://v3.tailwindcss.com',
  coreDependencies: ['tailwindcss', 'autoprefixer', 'postcss'],
  initCommand: 'npx tailwindcss init -p',
  cssEntryContent: '@tailwind base;\n@tailwind components;\n@tailwind utilities;',
  postcssPluginConfig: {
    tailwindcss: {},
    autoprefixer: {},
  },
  configFileRequired: true,
  generateTailwindConfig: (contentPaths: string[], includeTypescript: boolean): string => {
    const typeAnnotation = includeTypescript ? ': import("tailwindcss").Config' : '';
    return `/** @type {import('tailwindcss').Config} */
${includeTypescript ? 'import type { Config } from "tailwindcss";' : ''}

${includeTypescript ? 'const config: Config = {' : 'module.exports = {'}
  content: [
    ${contentPaths.map(path => `"${path}"`).join(',\n    ')}
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}${includeTypescript ? ';\n\nexport default config;' : ''}`;
  },
  renamedUtilities: v3RenamedUtilities,
  paletteConfigFormat: (name: string, colors: Record<string, string>): string => {
    return `// Add to your tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        ${name}: ${JSON.stringify(colors, null, 10).replace(/"/g, "'")}
      }
    }
  }
}`;
  },
};

const v4Config: TailwindVersionConfig = {
  version: 'v4',
  docsBaseUrl: 'https://tailwindcss.com',
  coreDependencies: ['tailwindcss', '@tailwindcss/postcss'],
  initCommand: null,
  cssEntryContent: '@import "tailwindcss";',
  postcssPluginConfig: {
    '@tailwindcss/postcss': {},
  },
  configFileRequired: false,
  generateTailwindConfig: (_contentPaths: string[], _includeTypescript: boolean): string => {
    return `/* TailwindCSS v4 uses CSS-first configuration.
   Add customizations directly in your CSS file using @theme. */

/* Example CSS-first config in your main CSS file: */
/*
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --font-sans: "Inter", sans-serif;
}
*/`;
  },
  renamedUtilities: v4RenamedUtilities,
  paletteConfigFormat: (name: string, colors: Record<string, string>): string => {
    let css = `/* Add to your main CSS file (TailwindCSS v4 CSS-first config) */\n@theme {\n`;
    for (const [shade, color] of Object.entries(colors)) {
      css += `  --color-${name}-${shade}: ${color};\n`;
    }
    css += `}`;
    return css;
  },
};

const versionConfigs: Record<TailwindVersion, TailwindVersionConfig> = {
  v3: v3Config,
  v4: v4Config,
};

export function getVersionConfig(version?: TailwindVersion): TailwindVersionConfig {
  const v = version || DEFAULT_VERSION;
  return versionConfigs[v];
}
