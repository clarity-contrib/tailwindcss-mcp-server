/**
 * Utility Mapper Service for TailwindCSS MCP Server
 * Handles mapping between CSS properties and TailwindCSS utility classes
 */

import { parse } from 'css-tree';
import postcss from 'postcss';
import { BaseService, ServiceError } from './base.js';
import { 
  TailwindUtility, 
  UtilityValue, 
  UtilityModifier, 
  ConversionResult,
  ColorInfo,
  GetUtilitiesParams,
  GetColorsParams
} from '../types/index.js';

export class UtilityMapperService implements BaseService {
  private utilityMap: Map<string, TailwindUtility> = new Map();
  private cssPropertyMap: Map<string, string[]> = new Map();
  private colorMap: Map<string, ColorInfo> = new Map();

  async initialize(): Promise<void> {
    await this.loadUtilityMappings();
    await this.loadColorMappings();
    console.log('UtilityMapperService initialized');
  }

  async cleanup(): Promise<void> {
    this.utilityMap.clear();
    this.cssPropertyMap.clear();
    this.colorMap.clear();
  }

  /**
   * Converts CSS code to TailwindCSS utility classes
   */
  async convertCSSToTailwind(css: string, mode: "inline" | "classes" | "component" = "classes"): Promise<ConversionResult> {
    try {
      const result = await postcss().process(css, { from: undefined });
      const root = result.root;

      const tailwindClasses: string[] = [];
      const unsupportedStyles: string[] = [];
      const suggestions: string[] = [];

      root.walkDecls((decl) => {
        const cssProperty = decl.prop;
        const cssValue = decl.value;
        
        const utilities = this.cssPropertyMap.get(cssProperty);
        
        if (utilities && utilities.length > 0) {
          const matchingUtility = this.findBestUtilityMatch(cssProperty, cssValue);
          if (matchingUtility) {
            tailwindClasses.push(matchingUtility);
          } else {
            // Try to create arbitrary value
            const arbitraryUtility = this.createArbitraryUtility(cssProperty, cssValue);
            if (arbitraryUtility) {
              tailwindClasses.push(arbitraryUtility);
              suggestions.push(`Consider using ${arbitraryUtility} for ${cssProperty}: ${cssValue}`);
            } else {
              unsupportedStyles.push(`${cssProperty}: ${cssValue}`);
            }
          }
        } else {
          unsupportedStyles.push(`${cssProperty}: ${cssValue}`);
        }
      });

      return {
        tailwindClasses: tailwindClasses.join(' '),
        unsupportedStyles: unsupportedStyles.length > 0 ? unsupportedStyles : undefined,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      };

    } catch (error) {
      throw new ServiceError(
        'Failed to convert CSS to TailwindCSS',
        'UtilityMapperService',
        'convertCSSToTailwind',
        error
      );
    }
  }

  /**
   * Gets all utilities for a specific category
   */
  getUtilitiesByCategory(category: string): TailwindUtility[] {
    return Array.from(this.utilityMap.values())
      .filter(utility => utility.category.id === category);
  }

  /**
   * Gets all utilities for a specific CSS property
   */
  getUtilitiesByProperty(property: string): TailwindUtility[] {
    const utilities = this.cssPropertyMap.get(property) || [];
    return utilities
      .map(utilityId => this.utilityMap.get(utilityId))
      .filter((utility): utility is TailwindUtility => utility !== undefined);
  }

  /**
   * Searches utilities by name or description
   */
  searchUtilities(query: string): TailwindUtility[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.utilityMap.values())
      .filter(utility => 
        utility.name.toLowerCase().includes(lowerQuery) ||
        utility.documentation.toLowerCase().includes(lowerQuery) ||
        utility.category.name.toLowerCase().includes(lowerQuery)
      )
      .sort((a, b) => {
        // Prioritize exact name matches
        if (a.name.toLowerCase() === lowerQuery) return -1;
        if (b.name.toLowerCase() === lowerQuery) return 1;
        return a.name.localeCompare(b.name);
      });
  }

  /**
   * Gets utilities based on parameters (for MCP tool interface)
   */
  async getUtilities(params: GetUtilitiesParams): Promise<TailwindUtility[]> {
    let utilities: TailwindUtility[] = [];

    if (params.category) {
      utilities = this.getUtilitiesByCategory(params.category);
    } else if (params.property) {
      utilities = this.getUtilitiesByProperty(params.property);
    } else if (params.search) {
      utilities = this.searchUtilities(params.search);
    } else {
      // Return all utilities if no filter specified
      utilities = Array.from(this.utilityMap.values());
    }

    return utilities;
  }

  /**
   * Gets colors based on parameters (for MCP tool interface)
   */
  async getColors(params: GetColorsParams): Promise<ColorInfo[]> {
    let colors = this.getColorInfo(params.colorName);
    
    if (!params.includeShades) {
      // Filter out shade details if requested
      colors = colors.map(color => ({
        ...color,
        shades: {},
      }));
    }

    return colors;
  }

  /**
   * Gets color information for a specific color or all colors
   */
  getColorInfo(colorName?: string): ColorInfo[] {
    if (colorName) {
      const color = this.colorMap.get(colorName);
      return color ? [color] : [];
    }
    return Array.from(this.colorMap.values());
  }

  /**
   * Generates arbitrary value utility classes
   */
  generateArbitraryUtility(property: string, value: string): string | null {
    return this.createArbitraryUtility(property, value);
  }

  /**
   * Private methods
   */
  private async loadUtilityMappings(): Promise<void> {
    // This would typically load from a comprehensive mapping file
    // For now, we'll create some basic mappings as examples
    
    // Spacing utilities
    this.addUtility('m-0', 'margin', '0', 'spacing');
    this.addUtility('m-1', 'margin', '0.25rem', 'spacing');
    this.addUtility('m-2', 'margin', '0.5rem', 'spacing');
    this.addUtility('m-4', 'margin', '1rem', 'spacing');
    this.addUtility('m-8', 'margin', '2rem', 'spacing');

    this.addUtility('p-0', 'padding', '0', 'spacing');
    this.addUtility('p-1', 'padding', '0.25rem', 'spacing');
    this.addUtility('p-2', 'padding', '0.5rem', 'spacing');
    this.addUtility('p-4', 'padding', '1rem', 'spacing');
    this.addUtility('p-8', 'padding', '2rem', 'spacing');

    // Width utilities
    this.addUtility('w-auto', 'width', 'auto', 'sizing');
    this.addUtility('w-full', 'width', '100%', 'sizing');
    this.addUtility('w-1/2', 'width', '50%', 'sizing');
    this.addUtility('w-1/3', 'width', '33.333333%', 'sizing');

    // Height utilities
    this.addUtility('h-auto', 'height', 'auto', 'sizing');
    this.addUtility('h-full', 'height', '100%', 'sizing');
    this.addUtility('h-screen', 'height', '100vh', 'sizing');

    // Display utilities
    this.addUtility('block', 'display', 'block', 'layout');
    this.addUtility('inline', 'display', 'inline', 'layout');
    this.addUtility('flex', 'display', 'flex', 'flexbox');
    this.addUtility('grid', 'display', 'grid', 'grid');
    this.addUtility('hidden', 'display', 'none', 'layout');

    // Typography utilities
    this.addUtility('text-xs', 'font-size', '0.75rem', 'typography');
    this.addUtility('text-sm', 'font-size', '0.875rem', 'typography');
    this.addUtility('text-base', 'font-size', '1rem', 'typography');
    this.addUtility('text-lg', 'font-size', '1.125rem', 'typography');
    this.addUtility('text-xl', 'font-size', '1.25rem', 'typography');
  }

  private async loadColorMappings(): Promise<void> {
    // Default TailwindCSS color palette
    const colors = {
      slate: {
        '50': '#f8fafc',
        '100': '#f1f5f9',
        '200': '#e2e8f0',
        '300': '#cbd5e1',
        '400': '#94a3b8',
        '500': '#64748b',
        '600': '#475569',
        '700': '#334155',
        '800': '#1e293b',
        '900': '#0f172a',
      },
      blue: {
        '50': '#eff6ff',
        '100': '#dbeafe',
        '200': '#bfdbfe',
        '300': '#93c5fd',
        '400': '#60a5fa',
        '500': '#3b82f6',
        '600': '#2563eb',
        '700': '#1d4ed8',
        '800': '#1e40af',
        '900': '#1e3a8a',
      },
      // Add more colors as needed
    };

    for (const [colorName, shades] of Object.entries(colors)) {
      const usage = Object.keys(shades).flatMap(shade => [
        `text-${colorName}-${shade}`,
        `bg-${colorName}-${shade}`,
        `border-${colorName}-${shade}`,
      ]);

      this.colorMap.set(colorName, {
        name: colorName,
        shades,
        usage,
      });
    }
  }

  private addUtility(className: string, cssProperty: string, cssValue: string, category: string): void {
    const utility: TailwindUtility = {
      id: className,
      name: className,
      category: {
        id: category,
        name: category,
        description: '',
        utilities: [],
      },
      cssProperty,
      values: [{
        class: className,
        value: cssValue,
        isDefault: false,
      }],
      modifiers: this.getDefaultModifiers(),
      examples: [{
        title: `Using ${className}`,
        code: `<div class="${className}">Content</div>`,
        description: `Applies ${cssProperty}: ${cssValue}`,
      }],
      documentation: `Sets ${cssProperty} to ${cssValue}`,
    };

    this.utilityMap.set(className, utility);

    // Update CSS property mapping
    const existingUtilities = this.cssPropertyMap.get(cssProperty) || [];
    this.cssPropertyMap.set(cssProperty, [...existingUtilities, className]);
  }

  private findBestUtilityMatch(cssProperty: string, cssValue: string): string | null {
    const utilities = this.cssPropertyMap.get(cssProperty) || [];
    
    for (const utilityId of utilities) {
      const utility = this.utilityMap.get(utilityId);
      if (utility) {
        for (const value of utility.values) {
          if (value.value === cssValue) {
            return value.class;
          }
        }
      }
    }
    
    return null;
  }

  private createArbitraryUtility(cssProperty: string, cssValue: string): string | null {
    // Create arbitrary value utilities for unsupported values
    const propertyAbbreviations: Record<string, string> = {
      'margin': 'm',
      'padding': 'p',
      'width': 'w',
      'height': 'h',
      'top': 'top',
      'right': 'right',
      'bottom': 'bottom',
      'left': 'left',
      'font-size': 'text',
      'line-height': 'leading',
      'color': 'text',
      'background-color': 'bg',
      'border-color': 'border',
    };

    const abbreviation = propertyAbbreviations[cssProperty];
    if (abbreviation) {
      // Clean the CSS value for arbitrary syntax
      const cleanValue = cssValue.replace(/\s+/g, '_');
      return `${abbreviation}-[${cleanValue}]`;
    }

    return null;
  }

  private getDefaultModifiers(): UtilityModifier[] {
    return [
      {
        type: 'responsive',
        prefix: 'sm:',
        description: 'Apply on small screens and up',
      },
      {
        type: 'responsive',
        prefix: 'md:',
        description: 'Apply on medium screens and up',
      },
      {
        type: 'responsive',
        prefix: 'lg:',
        description: 'Apply on large screens and up',
      },
      {
        type: 'state',
        prefix: 'hover:',
        description: 'Apply on hover',
      },
      {
        type: 'state',
        prefix: 'focus:',
        description: 'Apply when focused',
      },
      {
        type: 'dark',
        prefix: 'dark:',
        description: 'Apply in dark mode',
      },
    ];
  }
}