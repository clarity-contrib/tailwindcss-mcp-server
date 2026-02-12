/**
 * Tests for TailwindCSS Version Configuration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getVersionConfig,
  DEFAULT_VERSION,
  SUPPORTED_VERSIONS,
  type TailwindVersion,
  type TailwindVersionConfig,
} from '../../version/index.js';

describe('TailwindCSS Version Configuration', () => {
  describe('constants', () => {
    it('should have v4 as default version', () => {
      expect(DEFAULT_VERSION).toBe('v4');
    });

    it('should support v3 and v4', () => {
      expect(SUPPORTED_VERSIONS).toEqual(['v3', 'v4']);
    });
  });

  describe('getVersionConfig', () => {
    it('should return v4 config by default', () => {
      const config = getVersionConfig();
      expect(config.version).toBe('v4');
    });

    it('should return v3 config when requested', () => {
      const config = getVersionConfig('v3');
      expect(config.version).toBe('v3');
    });

    it('should return v4 config when requested', () => {
      const config = getVersionConfig('v4');
      expect(config.version).toBe('v4');
    });
  });

  describe('v3 configuration', () => {
    let config: TailwindVersionConfig;

    beforeEach(() => {
      config = getVersionConfig('v3');
    });

    it('should use v3 docs URL', () => {
      expect(config.docsBaseUrl).toBe('https://v3.tailwindcss.com');
    });

    it('should have correct core dependencies', () => {
      expect(config.coreDependencies).toEqual(['tailwindcss', 'autoprefixer', 'postcss']);
    });

    it('should have init command', () => {
      expect(config.initCommand).toBe('npx tailwindcss init -p');
    });

    it('should use @tailwind directives for CSS entry', () => {
      expect(config.cssEntryContent).toContain('@tailwind base;');
      expect(config.cssEntryContent).toContain('@tailwind components;');
      expect(config.cssEntryContent).toContain('@tailwind utilities;');
    });

    it('should use tailwindcss and autoprefixer postcss plugins', () => {
      expect(config.postcssPluginConfig).toHaveProperty('tailwindcss');
      expect(config.postcssPluginConfig).toHaveProperty('autoprefixer');
    });

    it('should require config file', () => {
      expect(config.configFileRequired).toBe(true);
    });

    it('should generate module.exports config for JS', () => {
      const tailwindConfig = config.generateTailwindConfig(['./src/**/*.tsx'], false);
      expect(tailwindConfig).toContain('module.exports = {');
      expect(tailwindConfig).toContain('./src/**/*.tsx');
      expect(tailwindConfig).toContain('content: [');
      expect(tailwindConfig).toContain('theme: {');
      expect(tailwindConfig).toContain('plugins: [],');
    });

    it('should generate TypeScript config when requested', () => {
      const tailwindConfig = config.generateTailwindConfig(['./src/**/*.tsx'], true);
      expect(tailwindConfig).toContain('import type { Config } from "tailwindcss"');
      expect(tailwindConfig).toContain('const config: Config = {');
      expect(tailwindConfig).toContain('export default config;');
    });

    it('should have empty renamed utilities', () => {
      expect(config.renamedUtilities.size).toBe(0);
    });

    it('should generate JS palette config format', () => {
      const paletteConfig = config.paletteConfigFormat('primary', { '500': '#3b82f6' });
      expect(paletteConfig).toContain('module.exports = {');
      expect(paletteConfig).toContain('theme: {');
      expect(paletteConfig).toContain('colors: {');
      expect(paletteConfig).toContain('primary:');
    });
  });

  describe('v4 configuration', () => {
    let config: TailwindVersionConfig;

    beforeEach(() => {
      config = getVersionConfig('v4');
    });

    it('should use v4 docs URL', () => {
      expect(config.docsBaseUrl).toBe('https://tailwindcss.com');
    });

    it('should have correct core dependencies', () => {
      expect(config.coreDependencies).toEqual(['tailwindcss', '@tailwindcss/postcss']);
    });

    it('should not have init command', () => {
      expect(config.initCommand).toBeNull();
    });

    it('should use @import for CSS entry', () => {
      expect(config.cssEntryContent).toBe('@import "tailwindcss";');
    });

    it('should use @tailwindcss/postcss plugin', () => {
      expect(config.postcssPluginConfig).toHaveProperty('@tailwindcss/postcss');
      expect(config.postcssPluginConfig).not.toHaveProperty('autoprefixer');
    });

    it('should not require config file', () => {
      expect(config.configFileRequired).toBe(false);
    });

    it('should generate CSS-first config guide', () => {
      const tailwindConfig = config.generateTailwindConfig(['./src/**/*.tsx'], false);
      expect(tailwindConfig).toContain('@theme');
      expect(tailwindConfig).toContain('CSS-first configuration');
      expect(tailwindConfig).not.toContain('module.exports');
    });

    it('should have renamed utilities for v4', () => {
      expect(config.renamedUtilities.size).toBeGreaterThan(0);
      expect(config.renamedUtilities.get('decoration-slice')).toBe('box-decoration-slice');
      expect(config.renamedUtilities.get('flex-shrink')).toBe('shrink');
      expect(config.renamedUtilities.get('flex-grow')).toBe('grow');
    });

    it('should generate @theme palette config format', () => {
      const paletteConfig = config.paletteConfigFormat('primary', { '500': '#3b82f6' });
      expect(paletteConfig).toContain('@theme {');
      expect(paletteConfig).toContain('--color-primary-500: #3b82f6;');
      expect(paletteConfig).not.toContain('module.exports');
    });
  });

  describe('version differences', () => {
    it('should have different docs base URLs', () => {
      const v3 = getVersionConfig('v3');
      const v4 = getVersionConfig('v4');
      expect(v3.docsBaseUrl).not.toBe(v4.docsBaseUrl);
    });

    it('should have different core dependencies', () => {
      const v3 = getVersionConfig('v3');
      const v4 = getVersionConfig('v4');
      expect(v3.coreDependencies).not.toEqual(v4.coreDependencies);
      expect(v3.coreDependencies).toContain('autoprefixer');
      expect(v4.coreDependencies).toContain('@tailwindcss/postcss');
    });

    it('should have different CSS entry content', () => {
      const v3 = getVersionConfig('v3');
      const v4 = getVersionConfig('v4');
      expect(v3.cssEntryContent).not.toBe(v4.cssEntryContent);
    });

    it('should differ on config file requirement', () => {
      const v3 = getVersionConfig('v3');
      const v4 = getVersionConfig('v4');
      expect(v3.configFileRequired).toBe(true);
      expect(v4.configFileRequired).toBe(false);
    });
  });
});
