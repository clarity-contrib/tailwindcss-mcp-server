/**
 * Conversion Service for TailwindCSS MCP Server
 * Converts traditional CSS to TailwindCSS utilities using CSS parsing
 */

import { BaseService, ServiceError } from './base.js';
import type { ConversionResult, ConvertCSSParams } from '../types/index.js';
import * as csstree from 'css-tree';
import { getVersionConfig, DEFAULT_VERSION } from '../version/index.js';
import type { TailwindVersion } from '../version/index.js';

export class ConversionService implements BaseService {
  private propertyMap: Map<string, PropertyMapping> = new Map();
  private tailwindUtilities: Set<string> = new Set();
  
  async initialize(): Promise<void> {
    this.setupPropertyMappings();
    this.setupTailwindUtilities();
  }

  async cleanup(): Promise<void> {
    this.propertyMap.clear();
    this.tailwindUtilities.clear();
  }

  /**
   * Convert CSS to TailwindCSS utilities
   */
  async convertCSS(params: ConvertCSSParams): Promise<ConversionResult> {
    try {
      const { css, mode = 'classes', version = DEFAULT_VERSION } = params;
      const versionConfig = getVersionConfig(version);

      if (!css.trim()) {
        return {
          tailwindClasses: '',
          unsupportedStyles: [],
          suggestions: ['Provide some CSS to convert'],
          version
        };
      }

      // Check for obviously malformed CSS before parsing
      if (this.isMalformedCSS(css)) {
        throw new ServiceError(
          'Invalid CSS syntax',
          'ConversionService',
          'convertCSS'
        );
      }

      const ast = this.parseCSS(css);
      const conversions = this.extractStylesFromAST(ast);

      // Apply version-specific utility renames
      if (versionConfig.renamedUtilities.size > 0) {
        conversions.utilities = conversions.utilities.map(util => {
          return versionConfig.renamedUtilities.get(util) || util;
        });
      }

      return this.formatResult(conversions, mode, version);
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError(
        'Failed to convert CSS to TailwindCSS',
        'ConversionService',
        'convertCSS',
        error
      );
    }
  }

  /**
   * Parse CSS string into AST
   */
  private parseCSS(css: string): csstree.CssNode {
    try {
      return csstree.parse(css);
    } catch (error) {
      // Check for common invalid CSS patterns that should throw errors
      if (css.includes('{') && !css.includes('}')) {
        throw new ServiceError(
          'Invalid CSS syntax',
          'ConversionService',
          'parseCSS',
          error
        );
      }
      // For other parse errors, also throw
      throw new ServiceError(
        'Invalid CSS syntax',
        'ConversionService',
        'parseCSS',
        error
      );
    }
  }

  /**
   * Extract styles from CSS AST
   */
  private extractStylesFromAST(ast: csstree.CssNode): ConversionData {
    const result: ConversionData = {
      utilities: [],
      unsupported: [],
      custom: []
    };

    csstree.walk(ast, (node, item, list) => {
      if (node.type === 'Rule') {
        this.processRule(node as csstree.Rule, result);
      }
    });

    return result;
  }

  /**
   * Process a CSS rule
   */
  private processRule(rule: csstree.Rule, result: ConversionData): void {
    if (!rule.block || rule.block.type !== 'Block') return;

    const declarations: Array<{ property: string; value: string }> = [];
    
    csstree.walk(rule.block, (node) => {
      if (node.type === 'Declaration') {
        const declaration = node as csstree.Declaration;
        declarations.push({
          property: declaration.property,
          value: csstree.generate(declaration.value)
        });
      }
    });

    declarations.forEach(({ property, value }) => {
      this.processDeclaration(property, value, result);
    });
  }

  /**
   * Process a CSS declaration
   */
  private processDeclaration(property: string, value: string, result: ConversionData): void {
    const mapping = this.propertyMap.get(property);
    
    if (!mapping) {
      result.unsupported.push(`${property}: ${value}`);
      return;
    }

    const tailwindClass = this.convertDeclaration(property, value, mapping);
    
    if (tailwindClass) {
      // Check if it's a space-separated list of utilities (like "py-4 px-8")
      if (tailwindClass.includes(' ')) {
        const utilities = tailwindClass.split(' ');
        const validUtilities = utilities.filter(util => this.tailwindUtilities.has(util));
        if (validUtilities.length === utilities.length) {
          result.utilities.push(...validUtilities);
        } else {
          result.custom.push(`${property}: ${value} → Consider creating custom utility: ${tailwindClass}`);
        }
      } else if (this.tailwindUtilities.has(tailwindClass)) {
        result.utilities.push(tailwindClass);
      } else {
        result.custom.push(`${property}: ${value} → Consider creating custom utility: ${tailwindClass}`);
      }
    } else {
      result.unsupported.push(`${property}: ${value}`);
    }
  }

  /**
   * Convert a CSS declaration to TailwindCSS class
   */
  private convertDeclaration(property: string, value: string, mapping: PropertyMapping): string | null {
    const cleanValue = value.trim();

    // Handle specific value mappings
    if (mapping.valueMap && mapping.valueMap.has(cleanValue)) {
      return mapping.valueMap.get(cleanValue)!;
    }

    // Handle pattern-based mappings
    if (mapping.pattern) {
      return this.applyPattern(cleanValue, mapping.pattern, mapping.prefix);
    }

    // Handle unit-based mappings
    if (mapping.unitMapping) {
      return this.convertWithUnits(cleanValue, mapping.prefix);
    }

    return null;
  }

  /**
   * Apply pattern-based conversion
   */
  private applyPattern(value: string, pattern: RegExp, prefix: string): string | null {
    const match = value.match(pattern);
    if (match) {
      return `${prefix}-${match[1] || value}`;
    }
    return null;
  }

  /**
   * Convert values with unit handling
   */
  private convertWithUnits(value: string, prefix: string): string | null {
    // Handle shorthand values like "1rem 2rem" for padding/margin
    if (value.includes(' ')) {
      const values = value.split(/\s+/);
      if (values.length === 2) {
        if (values[0] === values[1]) {
          // Same value for all sides (e.g., "1rem 1rem")
          return this.convertSingleValue(values[0], prefix);
        } else {
          // Different vertical and horizontal (e.g., "1rem 2rem")
          const vertical = this.convertSingleValue(values[0], prefix.charAt(0) + 'y');
          const horizontal = this.convertSingleValue(values[1], prefix.charAt(0) + 'x');
          return [vertical, horizontal].filter(Boolean).join(' ');
        }
      } else if (values.length === 4) {
        // All sides specified
        const top = this.convertSingleValue(values[0], prefix.charAt(0) + 't');
        const right = this.convertSingleValue(values[1], prefix.charAt(0) + 'r');
        const bottom = this.convertSingleValue(values[2], prefix.charAt(0) + 'b');
        const left = this.convertSingleValue(values[3], prefix.charAt(0) + 'l');
        return [top, right, bottom, left].filter(Boolean).join(' ');
      }
    }
    
    return this.convertSingleValue(value, prefix);
  }

  /**
   * Convert a single value with unit handling
   */
  private convertSingleValue(value: string, prefix: string): string | null {
    // Handle numeric values with units
    const numericMatch = value.match(/^(-?\d*\.?\d+)(px|rem|em|%|vh|vw)?$/);
    if (numericMatch) {
      const [, num, unit] = numericMatch;
      const numValue = parseFloat(num);
      
      // Convert to Tailwind scale
      if (unit === 'px') {
        const remValue = numValue / 16; // Assuming 16px = 1rem
        const tailwindValue = this.findClosestTailwindValue(remValue);
        return `${prefix}-${tailwindValue}`;
      }
      
      if (unit === 'rem' || !unit) {
        const tailwindValue = this.findClosestTailwindValue(numValue);
        return `${prefix}-${tailwindValue}`;
      }
      
      if (unit === '%') {
        const percentValue = this.convertPercentToTailwind(numValue);
        return percentValue ? `${prefix}-${percentValue}` : null;
      }
    }

    return null;
  }

  /**
   * Find closest Tailwind spacing value
   */
  private findClosestTailwindValue(remValue: number): string {
    const spacingScale = [
      { value: 0, class: '0' },
      { value: 0.125, class: '0.5' },
      { value: 0.25, class: '1' },
      { value: 0.375, class: '1.5' },
      { value: 0.5, class: '2' },
      { value: 0.625, class: '2.5' },
      { value: 0.75, class: '3' },
      { value: 0.875, class: '3.5' },
      { value: 1, class: '4' },
      { value: 1.25, class: '5' },
      { value: 1.5, class: '6' },
      { value: 1.75, class: '7' },
      { value: 2, class: '8' },
      { value: 2.25, class: '9' },
      { value: 2.5, class: '10' },
      { value: 2.75, class: '11' },
      { value: 3, class: '12' },
      { value: 3.5, class: '14' },
      { value: 4, class: '16' },
      { value: 5, class: '20' },
      { value: 6, class: '24' }
    ];

    let closest = spacingScale[0];
    let minDiff = Math.abs(remValue - closest.value);

    for (const scale of spacingScale) {
      const diff = Math.abs(remValue - scale.value);
      if (diff < minDiff) {
        minDiff = diff;
        closest = scale;
      }
    }

    return closest.class;
  }

  /**
   * Convert percentage to Tailwind fraction
   */
  private convertPercentToTailwind(percent: number): string | null {
    const fractions = [
      { percent: 8.333333, class: '1/12' },
      { percent: 16.666667, class: '1/6' },
      { percent: 20, class: '1/5' },
      { percent: 25, class: '1/4' },
      { percent: 33.333333, class: '1/3' },
      { percent: 41.666667, class: '5/12' },
      { percent: 50, class: '1/2' },
      { percent: 58.333333, class: '7/12' },
      { percent: 66.666667, class: '2/3' },
      { percent: 75, class: '3/4' },
      { percent: 83.333333, class: '5/6' },
      { percent: 91.666667, class: '11/12' },
      { percent: 100, class: 'full' }
    ];

    let closest = fractions[0];
    let minDiff = Math.abs(percent - closest.percent);

    for (const fraction of fractions) {
      const diff = Math.abs(percent - fraction.percent);
      if (diff < minDiff) {
        minDiff = diff;
        closest = fraction;
      }
    }

    return minDiff < 2 ? closest.class : null; // Only return if close enough
  }

  /**
   * Format the conversion result
   */
  private formatResult(conversions: ConversionData, mode: string, version: TailwindVersion = DEFAULT_VERSION): ConversionResult {
    const result: ConversionResult = {
      tailwindClasses: '',
      unsupportedStyles: conversions.unsupported,
      suggestions: [],
      customUtilities: conversions.custom,
      version
    };

    // Add specific suggestions first
    if (conversions.unsupported.length > 0) {
      if (!result.suggestions) result.suggestions = [];
      result.suggestions.push("Some CSS properties don't have direct TailwindCSS equivalents. Consider using arbitrary values like [property:value]");
    }

    if (conversions.custom.length > 0) {
      if (!result.suggestions) result.suggestions = [];
      result.suggestions.push("Some values are outside Tailwind's default scale. Consider extending your Tailwind config or using arbitrary values");
    }

    if (conversions.utilities.length === 0) {
      // Only add the generic message if no specific suggestions were added
      if (!result.suggestions || result.suggestions.length === 0) {
        if (!result.suggestions) result.suggestions = [];
        result.suggestions.push('No direct TailwindCSS equivalents found for the provided CSS');
      }
      return result;
    }

    switch (mode) {
      case 'inline':
        result.tailwindClasses = `class="${conversions.utilities.join(' ')}"`;
        break;
      case 'component':
        result.tailwindClasses = `.component {\n  @apply ${conversions.utilities.join(' ')};\n}`;
        if (version === 'v4') {
          if (!result.suggestions) result.suggestions = [];
          result.suggestions.push('TailwindCSS v4 encourages CSS-first configuration. Consider using @theme and CSS custom properties instead of @apply for complex components.');
        }
        break;
      default: // 'classes'
        result.tailwindClasses = conversions.utilities.join(' ');
    }

    return result;
  }

  /**
   * Setup property mappings from CSS to TailwindCSS
   */
  private setupPropertyMappings(): void {
    // Display properties
    this.propertyMap.set('display', {
      prefix: '',
      valueMap: new Map([
        ['block', 'block'],
        ['inline-block', 'inline-block'],
        ['inline', 'inline'],
        ['flex', 'flex'],
        ['inline-flex', 'inline-flex'],
        ['table', 'table'],
        ['inline-table', 'inline-table'],
        ['table-caption', 'table-caption'],
        ['table-cell', 'table-cell'],
        ['table-column', 'table-column'],
        ['table-column-group', 'table-column-group'],
        ['table-footer-group', 'table-footer-group'],
        ['table-header-group', 'table-header-group'],
        ['table-row-group', 'table-row-group'],
        ['table-row', 'table-row'],
        ['flow-root', 'flow-root'],
        ['grid', 'grid'],
        ['inline-grid', 'inline-grid'],
        ['contents', 'contents'],
        ['list-item', 'list-item'],
        ['hidden', 'hidden'],
        ['none', 'hidden']
      ])
    });

    // Position properties
    this.propertyMap.set('position', {
      prefix: '',
      valueMap: new Map([
        ['static', 'static'],
        ['fixed', 'fixed'],
        ['absolute', 'absolute'],
        ['relative', 'relative'],
        ['sticky', 'sticky']
      ])
    });

    // Spacing properties
    this.propertyMap.set('margin', { prefix: 'm', unitMapping: true });
    this.propertyMap.set('margin-top', { prefix: 'mt', unitMapping: true });
    this.propertyMap.set('margin-right', { prefix: 'mr', unitMapping: true });
    this.propertyMap.set('margin-bottom', { prefix: 'mb', unitMapping: true });
    this.propertyMap.set('margin-left', { prefix: 'ml', unitMapping: true });
    
    this.propertyMap.set('padding', { prefix: 'p', unitMapping: true });
    this.propertyMap.set('padding-top', { prefix: 'pt', unitMapping: true });
    this.propertyMap.set('padding-right', { prefix: 'pr', unitMapping: true });
    this.propertyMap.set('padding-bottom', { prefix: 'pb', unitMapping: true });
    this.propertyMap.set('padding-left', { prefix: 'pl', unitMapping: true });

    // Width and Height
    this.propertyMap.set('width', { prefix: 'w', unitMapping: true });
    this.propertyMap.set('height', { prefix: 'h', unitMapping: true });
    this.propertyMap.set('min-width', { prefix: 'min-w', unitMapping: true });
    this.propertyMap.set('max-width', { prefix: 'max-w', unitMapping: true });
    this.propertyMap.set('min-height', { prefix: 'min-h', unitMapping: true });
    this.propertyMap.set('max-height', { prefix: 'max-h', unitMapping: true });

    // Typography
    this.propertyMap.set('font-size', { prefix: 'text', unitMapping: true });
    this.propertyMap.set('font-weight', {
      prefix: 'font',
      valueMap: new Map([
        ['100', 'font-thin'],
        ['200', 'font-extralight'],
        ['300', 'font-light'],
        ['400', 'font-normal'],
        ['500', 'font-medium'],
        ['600', 'font-semibold'],
        ['700', 'font-bold'],
        ['800', 'font-extrabold'],
        ['900', 'font-black'],
        ['normal', 'font-normal'],
        ['bold', 'font-bold']
      ])
    });

    this.propertyMap.set('text-align', {
      prefix: 'text',
      valueMap: new Map([
        ['left', 'text-left'],
        ['center', 'text-center'],
        ['right', 'text-right'],
        ['justify', 'text-justify']
      ])
    });

    // Colors
    this.propertyMap.set('color', { prefix: 'text', pattern: /#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})/ });
    this.propertyMap.set('background-color', { prefix: 'bg', pattern: /#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})/ });
    this.propertyMap.set('border-color', { prefix: 'border', pattern: /#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})/ });

    // Flexbox
    this.propertyMap.set('flex-direction', {
      prefix: 'flex',
      valueMap: new Map([
        ['row', 'flex-row'],
        ['row-reverse', 'flex-row-reverse'],
        ['column', 'flex-col'],
        ['column-reverse', 'flex-col-reverse']
      ])
    });

    this.propertyMap.set('justify-content', {
      prefix: 'justify',
      valueMap: new Map([
        ['flex-start', 'justify-start'],
        ['flex-end', 'justify-end'],
        ['center', 'justify-center'],
        ['space-between', 'justify-between'],
        ['space-around', 'justify-around'],
        ['space-evenly', 'justify-evenly']
      ])
    });

    this.propertyMap.set('align-items', {
      prefix: 'items',
      valueMap: new Map([
        ['flex-start', 'items-start'],
        ['flex-end', 'items-end'],
        ['center', 'items-center'],
        ['baseline', 'items-baseline'],
        ['stretch', 'items-stretch']
      ])
    });
  }

  /**
   * Setup common TailwindCSS utilities for validation
   */
  private setupTailwindUtilities(): void {
    const utilities = [
      // Display
      'block', 'inline-block', 'inline', 'flex', 'inline-flex', 'grid', 'inline-grid', 'hidden',
      
      // Position
      'static', 'fixed', 'absolute', 'relative', 'sticky',
      
      // Spacing (sample)
      'm-0', 'm-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6', 'm-8', 'm-10', 'm-12', 'mb-8',
      'mt-0', 'mt-1', 'mt-2', 'mt-3', 'mt-4', 'mt-5', 'mt-6', 'mt-8', 'mt-10', 'mt-12',
      'mr-0', 'mr-1', 'mr-2', 'mr-3', 'mr-4', 'mr-5', 'mr-6', 'mr-8', 'mr-10', 'mr-12',
      'mb-0', 'mb-1', 'mb-2', 'mb-3', 'mb-4', 'mb-5', 'mb-6', 'mb-8', 'mb-10', 'mb-12',
      'ml-0', 'ml-1', 'ml-2', 'ml-3', 'ml-4', 'ml-5', 'ml-6', 'ml-8', 'ml-10', 'ml-12',
      'p-0', 'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-8', 'p-10', 'p-12',
      'px-0', 'px-1', 'px-2', 'px-3', 'px-4', 'px-5', 'px-6', 'px-8', 'px-10', 'px-12',
      'py-0', 'py-1', 'py-2', 'py-3', 'py-4', 'py-5', 'py-6', 'py-8', 'py-10', 'py-12',
      'pt-0', 'pt-1', 'pt-2', 'pt-3', 'pt-4', 'pt-5', 'pt-6', 'pt-8', 'pt-10', 'pt-12',
      'pr-0', 'pr-1', 'pr-2', 'pr-3', 'pr-4', 'pr-5', 'pr-6', 'pr-8', 'pr-10', 'pr-12',
      'pb-0', 'pb-1', 'pb-2', 'pb-3', 'pb-4', 'pb-5', 'pb-6', 'pb-8', 'pb-10', 'pb-12',
      'pl-0', 'pl-1', 'pl-2', 'pl-3', 'pl-4', 'pl-5', 'pl-6', 'pl-8', 'pl-10', 'pl-12',
      
      // Width/Height (sample)
      'w-0', 'w-1', 'w-2', 'w-3', 'w-4', 'w-5', 'w-6', 'w-8', 'w-10', 'w-12', 'w-16', 'w-full', 'w-1/2', 'w-1/3', 'w-2/3', 'w-1/4', 'w-3/4',
      'h-0', 'h-1', 'h-2', 'h-3', 'h-4', 'h-5', 'h-6', 'h-8', 'h-10', 'h-12', 'h-16', 'h-full', 'h-screen',
      
      // Typography
      'font-thin', 'font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-extrabold', 'font-black',
      'text-left', 'text-center', 'text-right', 'text-justify',
      'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl',
      
      // Flexbox
      'flex-row', 'flex-row-reverse', 'flex-col', 'flex-col-reverse',
      'justify-start', 'justify-end', 'justify-center', 'justify-between', 'justify-around', 'justify-evenly',
      'items-start', 'items-end', 'items-center', 'items-baseline', 'items-stretch'
    ];

    utilities.forEach(utility => this.tailwindUtilities.add(utility));
  }

  /**
   * Check if CSS is malformed
   */
  private isMalformedCSS(css: string): boolean {
    // Check for unbalanced braces
    const openBraces = (css.match(/{/g) || []).length;
    const closeBraces = (css.match(/}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      return true;
    }

    // Skip @media and @keyframes rules which are valid but complex
    if (css.includes('@media') || css.includes('@keyframes') || css.includes('@supports')) {
      return false;
    }

    // Check for selectors with opening brace but no closing brace on the same "rule"
    const rules = css.split('}');
    for (const rule of rules) {
      const trimmedRule = rule.trim();
      if (trimmedRule && trimmedRule.includes('{')) {
        // This rule has an opening brace, check if it looks malformed
        const afterBrace = trimmedRule.split('{')[1];
        if (afterBrace && afterBrace.trim() && !afterBrace.includes(':') && !afterBrace.includes('@')) {
          // Has content after brace but no colon (likely malformed property)
          // But skip @ rules which are valid
          return true;
        }
      }
    }

    return false;
  }
}

interface PropertyMapping {
  prefix: string;
  valueMap?: Map<string, string>;
  pattern?: RegExp;
  unitMapping?: boolean;
}

interface UnitMapping {
  [unit: string]: (value: number) => string | null;
}

interface ConversionData {
  utilities: string[];
  unsupported: string[];
  custom: string[];
}