/**
 * Core type definitions for TailwindCSS MCP Server
 * Based on the implementation plan in TAILWINDCSS_MCP_IMPLEMENTATION_PLAN.md
 */

import type { TailwindVersion } from '../version/index.js';

export type { TailwindVersion } from '../version/index.js';

export interface TailwindUtility {
  id: string;
  name: string;
  category: UtilityCategory;
  cssProperty: string | string[];
  values: UtilityValue[];
  modifiers: UtilityModifier[];
  examples: Example[];
  documentation: string;
}

export interface UtilityCategory {
  id: string;
  name: string;
  description: string;
  utilities: string[]; // Utility IDs
}

export interface UtilityValue {
  class: string;
  value: string;
  isDefault?: boolean;
  isArbitrary?: boolean;
}

export interface UtilityModifier {
  type: "responsive" | "state" | "dark" | "group" | "peer";
  prefix: string;
  description: string;
}

export interface Example {
  title: string;
  code: string;
  description?: string;
}

export interface ColorInfo {
  name: string;
  shades: {
    [key: string]: string; // e.g., "500": "#3b82f6"
  };
  usage: string[]; // e.g., ["text-blue-500", "bg-blue-500"]
}

export interface ConfigurationPattern {
  id: string;
  framework: string;
  pattern: string;
  description: string;
  code: string;
  dependencies: string[];
}

export interface CachedDocument {
  url: string;
  content: string;
  lastUpdated: Date;
  category: string;
  metadata: Record<string, any>;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  relevance: number;
}

export interface ConfigGuide {
  topic: string;
  description: string;
  examples: ConfigExample[];
  bestPractices: string[];
}

export interface ConfigExample {
  title: string;
  code: string;
  framework?: string;
}

export interface InstallationGuide {
  commands: string[];
  configFiles: {
    filename: string;
    content: string;
  }[];
  nextSteps: string[];
  version: TailwindVersion;
}

export interface ConversionResult {
  tailwindClasses: string;
  unsupportedStyles?: string[];
  suggestions?: string[];
  customUtilities?: string[];
  version: TailwindVersion;
}

export interface ColorPalette {
  name: string;
  colors: {
    [shade: string]: string;
  };
  cssVariables: string;
  tailwindConfig: string;
  version: TailwindVersion;
}

export interface UsageAnalysis {
  totalClasses: number;
  uniqueClasses: number;
  duplicatePatterns: DuplicatePattern[];
  suggestions: OptimizationSuggestion[];
  unusedUtilities?: string[];
}

export interface DuplicatePattern {
  pattern: string;
  occurrences: number;
  files: string[];
}

export interface OptimizationSuggestion {
  type: "duplicate" | "component" | "unused" | "arbitrary";
  description: string;
  example?: string;
}

export interface ComponentTemplate {
  html: string;
  description: string;
  utilities: string[];
  customizations: string[];
}

// Tool parameter interfaces
export interface GetUtilitiesParams {
  category?: string;
  property?: string;
  search?: string;
  version?: TailwindVersion;
}

export interface GetColorsParams {
  colorName?: string;
  includeShades?: boolean;
  version?: TailwindVersion;
}

export interface ConfigGuideParams {
  topic?: string;
  framework?: string;
  version?: TailwindVersion;
}

export interface SearchDocsParams {
  query: string;
  category?: string;
  limit?: number;
  version?: TailwindVersion;
}

export interface InstallTailwindParams {
  framework: string;
  packageManager?: "npm" | "yarn" | "pnpm" | "bun";
  includeTypescript?: boolean;
  version?: TailwindVersion;
}

export interface ConvertCSSParams {
  css: string;
  mode?: "inline" | "classes" | "component";
  version?: TailwindVersion;
}

export interface GeneratePaletteParams {
  baseColor: string;
  name: string;
  shades?: number[];
  version?: TailwindVersion;
}

export interface AnalyzeUsageParams {
  projectPath?: string;
  checkDuplicates?: boolean;
  checkUnused?: boolean;
  version?: TailwindVersion;
}

export interface GenerateTemplateParams {
  componentType: string;
  style?: "minimal" | "modern" | "playful";
  darkMode?: boolean;
  responsive?: boolean;
  version?: TailwindVersion;
}