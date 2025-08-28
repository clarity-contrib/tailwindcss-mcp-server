/**
 * Template Service for TailwindCSS MCP Server
 * Generates component templates and color palettes
 */

import { BaseService, ServiceError } from './base.js';
import type { 
  ComponentTemplate, 
  ColorPalette, 
  GenerateTemplateParams, 
  GeneratePaletteParams 
} from '../types/index.js';

export class TemplateService implements BaseService {
  private componentTemplates: Map<string, ComponentGenerator> = new Map();
  
  async initialize(): Promise<void> {
    this.setupComponentTemplates();
  }

  async cleanup(): Promise<void> {
    this.componentTemplates.clear();
  }

  /**
   * Generate component template
   */
  async generateComponentTemplate(params: GenerateTemplateParams): Promise<ComponentTemplate> {
    try {
      const { componentType, style = 'modern', darkMode = false, responsive = true } = params;
      
      const generator = this.componentTemplates.get(componentType.toLowerCase());
      if (!generator) {
        throw new ServiceError(
          `Unsupported component type: ${componentType}`,
          'TemplateService',
          'generateComponentTemplate'
        );
      }

      return generator(style, darkMode, responsive);
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError(
        'Failed to generate component template',
        'TemplateService',
        'generateComponentTemplate',
        error
      );
    }
  }

  /**
   * Generate color palette
   */
  async generateColorPalette(params: GeneratePaletteParams): Promise<ColorPalette> {
    try {
      const { baseColor, name, shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] } = params;
      
      if (!this.isValidColor(baseColor)) {
        throw new ServiceError(
          `Invalid color format: ${baseColor}. Use hex, rgb, or hsl format.`,
          'TemplateService',
          'generateColorPalette'
        );
      }

      const colors = this.generateColorShades(baseColor, shades);
      const cssVariables = this.generateCSSVariables(name, colors);
      const tailwindConfig = this.generateTailwindColorConfig(name, colors);

      return {
        name,
        colors,
        cssVariables,
        tailwindConfig
      };
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError(
        'Failed to generate color palette',
        'TemplateService',
        'generateColorPalette',
        error
      );
    }
  }

  /**
   * Get available component types
   */
  getAvailableComponents(): string[] {
    return Array.from(this.componentTemplates.keys());
  }

  /**
   * Setup component template generators
   */
  private setupComponentTemplates(): void {
    this.componentTemplates.set('button', this.generateButtonTemplate.bind(this));
    this.componentTemplates.set('card', this.generateCardTemplate.bind(this));
    this.componentTemplates.set('form', this.generateFormTemplate.bind(this));
    this.componentTemplates.set('navbar', this.generateNavbarTemplate.bind(this));
    this.componentTemplates.set('modal', this.generateModalTemplate.bind(this));
    this.componentTemplates.set('alert', this.generateAlertTemplate.bind(this));
    this.componentTemplates.set('badge', this.generateBadgeTemplate.bind(this));
    this.componentTemplates.set('breadcrumb', this.generateBreadcrumbTemplate.bind(this));
  }

  /**
   * Generate button component template
   */
  private generateButtonTemplate(style: string, darkMode: boolean, responsive: boolean): ComponentTemplate {
    const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';
    
    let styleClasses = '';
    let darkClasses = '';

    switch (style) {
      case 'minimal':
        styleClasses = 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground px-4 py-2';
        darkClasses = darkMode ? 'dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700' : '';
        break;
      case 'playful':
        styleClasses = 'bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg px-6 py-3 text-base';
        darkClasses = darkMode ? 'dark:from-purple-600 dark:to-pink-600' : '';
        break;
      default: // modern
        styleClasses = 'bg-primary text-primary-foreground shadow hover:bg-primary/90 px-4 py-2';
        darkClasses = darkMode ? 'dark:bg-blue-600 dark:hover:bg-blue-700' : '';
    }

    const responsiveClasses = responsive ? 'sm:px-6 sm:py-3 sm:text-base' : '';
    const finalClasses = [baseClasses, styleClasses, darkClasses, responsiveClasses].filter(Boolean).join(' ');

    const html = `<button class="${finalClasses}">
  Click me
</button>`;

    return {
      html,
      description: `A ${style} style button component${darkMode ? ' with dark mode support' : ''}${responsive ? ' and responsive design' : ''}`,
      utilities: finalClasses.split(' ').filter(Boolean),
      customizations: [
        'Change button text',
        'Adjust padding with px-* py-* classes',
        'Modify colors using bg-* and text-* utilities',
        'Add icons using flex and space-x-* utilities'
      ]
    };
  }

  /**
   * Generate card component template
   */
  private generateCardTemplate(style: string, darkMode: boolean, responsive: boolean): ComponentTemplate {
    const baseClasses = 'rounded-lg border bg-card text-card-foreground shadow-sm';
    
    let styleClasses = '';
    let darkClasses = '';

    switch (style) {
      case 'minimal':
        styleClasses = 'p-4 border-gray-200';
        darkClasses = darkMode ? 'dark:bg-gray-800 dark:border-gray-700' : '';
        break;
      case 'playful':
        styleClasses = 'p-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50';
        darkClasses = darkMode ? 'dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-700' : '';
        break;
      default: // modern
        styleClasses = 'p-6 border-gray-100 bg-white';
        darkClasses = darkMode ? 'dark:bg-gray-800 dark:border-gray-700' : '';
    }

    const responsiveClasses = responsive ? 'sm:p-8' : '';
    const cardClasses = [baseClasses, styleClasses, darkClasses, responsiveClasses].filter(Boolean).join(' ');

    const html = `<div class="${cardClasses}">
  <div class="flex flex-col space-y-1.5 pb-6">
    <h3 class="text-2xl font-semibold leading-none tracking-tight">Card Title</h3>
    <p class="text-sm text-muted-foreground">Card description goes here</p>
  </div>
  <div class="space-y-4">
    <p>This is the card content area. You can add any content here.</p>
  </div>
  <div class="flex items-center pt-6">
    <button class="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2">
      Action
    </button>
  </div>
</div>`;

    return {
      html,
      description: `A ${style} style card component${darkMode ? ' with dark mode support' : ''}${responsive ? ' and responsive design' : ''}`,
      utilities: cardClasses.split(' ').filter(Boolean),
      customizations: [
        'Customize card padding',
        'Adjust border radius with rounded-* classes',
        'Modify shadow with shadow-* utilities',
        'Change background colors and text colors'
      ]
    };
  }

  /**
   * Generate form component template
   */
  private generateFormTemplate(style: string, darkMode: boolean, responsive: boolean): ComponentTemplate {
    const containerClasses = 'space-y-6';
    const inputClasses = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';
    const labelClasses = 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70';
    
    let styleClasses = '';
    let darkClasses = '';

    switch (style) {
      case 'minimal':
        styleClasses = 'border-gray-300';
        darkClasses = darkMode ? 'dark:border-gray-600 dark:bg-gray-800' : '';
        break;
      case 'playful':
        styleClasses = 'border-2 border-purple-200 focus:border-purple-400';
        darkClasses = darkMode ? 'dark:border-purple-700 dark:focus:border-purple-500' : '';
        break;
      default: // modern
        styleClasses = 'border-gray-200 focus:border-blue-500';
        darkClasses = darkMode ? 'dark:border-gray-600 dark:bg-gray-700' : '';
    }

    const finalInputClasses = [inputClasses, styleClasses, darkClasses].filter(Boolean).join(' ');
    const responsiveClasses = responsive ? 'sm:space-y-8' : '';
    const finalContainerClasses = [containerClasses, responsiveClasses].filter(Boolean).join(' ');

    const html = `<form class="${finalContainerClasses}">
  <div class="space-y-2">
    <label for="name" class="${labelClasses}">Name</label>
    <input
      type="text"
      id="name"
      placeholder="Enter your name"
      class="${finalInputClasses}"
    />
  </div>
  
  <div class="space-y-2">
    <label for="email" class="${labelClasses}">Email</label>
    <input
      type="email"
      id="email"
      placeholder="Enter your email"
      class="${finalInputClasses}"
    />
  </div>
  
  <div class="space-y-2">
    <label for="message" class="${labelClasses}">Message</label>
    <textarea
      id="message"
      placeholder="Enter your message"
      rows="4"
      class="${finalInputClasses} min-h-[80px]"
    ></textarea>
  </div>
  
  <button
    type="submit"
    class="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 w-full"
  >
    Submit
  </button>
</form>`;

    return {
      html,
      description: `A ${style} style form component${darkMode ? ' with dark mode support' : ''}${responsive ? ' and responsive design' : ''}`,
      utilities: [...finalContainerClasses.split(' '), ...finalInputClasses.split(' ')].filter(Boolean),
      customizations: [
        'Add more form fields',
        'Customize input styling with border-* and focus:* utilities',
        'Adjust spacing with space-y-* utilities',
        'Add form validation styling'
      ]
    };
  }

  /**
   * Generate navbar component template
   */
  private generateNavbarTemplate(style: string, darkMode: boolean, responsive: boolean): ComponentTemplate {
    let baseClasses = 'border-b';
    let containerClasses = 'flex h-14 items-center px-4';
    let darkClasses = '';

    switch (style) {
      case 'minimal':
        baseClasses += ' border-gray-200 bg-white';
        darkClasses = darkMode ? 'dark:bg-gray-800 dark:border-gray-700' : '';
        break;
      case 'playful':
        baseClasses += ' border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50';
        darkClasses = darkMode ? 'dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-700' : '';
        break;
      default: // modern
        baseClasses += ' border-gray-100 bg-white/75 backdrop-blur';
        darkClasses = darkMode ? 'dark:bg-gray-900/75 dark:border-gray-800' : '';
    }

    const responsiveClasses = responsive ? 'sm:px-6 lg:px-8' : '';
    const finalContainerClasses = [containerClasses, responsiveClasses].filter(Boolean).join(' ');
    const finalBaseClasses = [baseClasses, darkClasses].filter(Boolean).join(' ');

    const html = `<nav class="${finalBaseClasses}">
  <div class="${finalContainerClasses}">
    <div class="mr-4 flex">
      <a class="mr-6 flex items-center space-x-2" href="/">
        <span class="font-bold text-xl">Logo</span>
      </a>
      <nav class="flex items-center space-x-6 text-sm font-medium${responsive ? ' hidden md:flex' : ''}">
        <a href="/" class="transition-colors hover:text-foreground/80 text-foreground/60">Home</a>
        <a href="/about" class="transition-colors hover:text-foreground/80 text-foreground/60">About</a>
        <a href="/services" class="transition-colors hover:text-foreground/80 text-foreground/60">Services</a>
        <a href="/contact" class="transition-colors hover:text-foreground/80 text-foreground/60">Contact</a>
      </nav>
    </div>
    <div class="flex flex-1 items-center justify-end space-x-2">
      <nav class="flex items-center">
        <button class="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2">
          Get Started
        </button>
      </nav>
    </div>
  </div>
</nav>`;

    return {
      html,
      description: `A ${style} style navbar${darkMode ? ' with dark mode support' : ''}${responsive ? ' and responsive design' : ''}`,
      utilities: [...finalBaseClasses.split(' '), ...finalContainerClasses.split(' ')].filter(Boolean),
      customizations: [
        'Update navigation links',
        'Add mobile menu toggle',
        'Customize logo and branding',
        'Adjust spacing and typography'
      ]
    };
  }

  /**
   * Generate modal component template
   */
  private generateModalTemplate(style: string, darkMode: boolean, responsive: boolean): ComponentTemplate {
    const overlayClasses = 'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm';
    let contentClasses = 'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg';
    let darkClasses = '';

    switch (style) {
      case 'minimal':
        contentClasses += ' border-gray-200';
        darkClasses = darkMode ? 'dark:bg-gray-800 dark:border-gray-700' : '';
        break;
      case 'playful':
        contentClasses += ' border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50';
        darkClasses = darkMode ? 'dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-700' : '';
        break;
      default: // modern
        contentClasses += ' border-gray-100 bg-white';
        darkClasses = darkMode ? 'dark:bg-gray-800 dark:border-gray-700' : '';
    }

    const responsiveClasses = responsive ? 'sm:max-w-[425px]' : '';
    const finalContentClasses = [contentClasses, darkClasses, responsiveClasses].filter(Boolean).join(' ');
    const finalOverlayClasses = [overlayClasses, darkMode ? 'dark:bg-gray-900/80' : ''].filter(Boolean).join(' ');

    const html = `<!-- Modal Overlay -->
<div class="${finalOverlayClasses}"></div>

<!-- Modal Content -->
<div class="${finalContentClasses}">
  <div class="flex flex-col space-y-1.5 text-center sm:text-left">
    <h2 class="text-lg font-semibold">Modal Title</h2>
    <p class="text-sm text-muted-foreground">
      Modal description goes here. Explain what this modal is for.
    </p>
  </div>
  
  <div class="grid gap-4 py-4">
    <p>Modal content goes here. You can add forms, text, or any other content.</p>
  </div>
  
  <div class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
    <button class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2 mt-2 sm:mt-0">
      Cancel
    </button>
    <button class="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2">
      Confirm
    </button>
  </div>
  
  <!-- Close Button -->
  <button class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
    <span class="sr-only">Close</span>
    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
</div>`;

    return {
      html,
      description: `A ${style} style modal component${darkMode ? ' with dark mode support' : ''}${responsive ? ' and responsive design' : ''}`,
      utilities: [...finalOverlayClasses.split(' '), ...finalContentClasses.split(' ')].filter(Boolean),
      customizations: [
        'Add JavaScript for show/hide functionality',
        'Customize modal size with max-w-* utilities',
        'Add form elements or custom content',
        'Implement backdrop click to close'
      ]
    };
  }

  /**
   * Generate alert component template
   */
  private generateAlertTemplate(style: string, darkMode: boolean, responsive: boolean): ComponentTemplate {
    let baseClasses = 'relative w-full rounded-lg border px-4 py-3 text-sm';
    let darkClasses = '';

    switch (style) {
      case 'minimal':
        baseClasses += ' border-gray-200 bg-gray-50';
        darkClasses = darkMode ? 'dark:bg-gray-800 dark:border-gray-700' : '';
        break;
      case 'playful':
        baseClasses += ' border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50';
        darkClasses = darkMode ? 'dark:from-blue-900/20 dark:to-cyan-900/20 dark:border-blue-700' : '';
        break;
      default: // modern
        baseClasses += ' border-blue-200 bg-blue-50';
        darkClasses = darkMode ? 'dark:bg-blue-900/20 dark:border-blue-800' : '';
    }

    const responsiveClasses = responsive ? 'sm:px-6 sm:py-4' : '';
    const finalClasses = [baseClasses, darkClasses, responsiveClasses].filter(Boolean).join(' ');

    const html = `<div class="${finalClasses}">
  <div class="flex">
    <div class="flex-shrink-0">
      <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
      </svg>
    </div>
    <div class="ml-3">
      <h3 class="text-sm font-medium text-blue-800">Alert Title</h3>
      <div class="mt-2 text-sm text-blue-700">
        <p>This is an informational alert message. You can customize the content and styling as needed.</p>
      </div>
    </div>
  </div>
</div>`;

    return {
      html,
      description: `A ${style} style alert component${darkMode ? ' with dark mode support' : ''}${responsive ? ' and responsive design' : ''}`,
      utilities: finalClasses.split(' ').filter(Boolean),
      customizations: [
        'Change alert type',
        'Replace the icon with appropriate type icons',
        'Add dismiss button functionality',
        'Customize border and background colors'
      ]
    };
  }

  /**
   * Generate badge component template
   */
  private generateBadgeTemplate(style: string, darkMode: boolean, responsive: boolean): ComponentTemplate {
    let baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
    let darkClasses = '';

    switch (style) {
      case 'minimal':
        baseClasses += ' border border-gray-200 bg-gray-100 text-gray-800';
        darkClasses = darkMode ? 'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300' : '';
        break;
      case 'playful':
        baseClasses += ' bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200';
        darkClasses = darkMode ? 'dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-300 dark:border-purple-700' : '';
        break;
      default: // modern
        baseClasses += ' bg-primary text-primary-foreground';
        darkClasses = darkMode ? 'dark:bg-blue-600' : '';
    }

    const responsiveClasses = responsive ? 'sm:px-3 sm:py-1 sm:text-sm' : '';
    const finalClasses = [baseClasses, darkClasses, responsiveClasses].filter(Boolean).join(' ');

    const html = `<span class="${finalClasses}">
  Badge
</span>

<!-- Variants -->
<span class="${finalClasses.replace('bg-primary', 'bg-green-100 text-green-800')}">
  Success
</span>

<span class="${finalClasses.replace('bg-primary', 'bg-red-100 text-red-800')}">
  Error
</span>

<span class="${finalClasses.replace('bg-primary', 'bg-yellow-100 text-yellow-800')}">
  Warning
</span>`;

    return {
      html,
      description: `${style} style badge components${darkMode ? ' with dark mode support' : ''}${responsive ? ' and responsive design' : ''}`,
      utilities: finalClasses.split(' ').filter(Boolean),
      customizations: [
        'Change badge colors using bg-* and text-* utilities',
        'Adjust size with px-* py-* and text-* utilities',
        'Add icons before or after text',
        'Make badges clickable by wrapping in button or anchor tags'
      ]
    };
  }

  /**
   * Generate breadcrumb component template
   */
  private generateBreadcrumbTemplate(style: string, darkMode: boolean, responsive: boolean): ComponentTemplate {
    const baseClasses = 'flex';
    const linkClasses = 'text-sm text-muted-foreground hover:text-foreground transition-colors';
    let separatorClasses = 'mx-2 text-muted-foreground';
    let darkClasses = '';

    switch (style) {
      case 'minimal':
        darkClasses = darkMode ? 'dark:text-gray-400 dark:hover:text-gray-200' : '';
        break;
      case 'playful':
        separatorClasses += ' text-purple-400';
        darkClasses = darkMode ? 'dark:text-purple-300' : '';
        break;
      default: // modern
        darkClasses = darkMode ? 'dark:text-gray-400 dark:hover:text-gray-200' : '';
    }

    const responsiveClasses = responsive ? 'sm:text-base' : '';
    const finalLinkClasses = [linkClasses, darkClasses, responsiveClasses].filter(Boolean).join(' ');

    const html = `<nav class="${baseClasses}" aria-label="Breadcrumb">
  <ol class="inline-flex items-center space-x-1 md:space-x-3">
    <li class="inline-flex items-center">
      <a href="/" class="${finalLinkClasses}">
        <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
        </svg>
        Home
      </a>
    </li>
    <li>
      <div class="flex items-center">
        <span class="${separatorClasses}">/</span>
        <a href="/category" class="${finalLinkClasses} ml-1 md:ml-2">Category</a>
      </div>
    </li>
    <li aria-current="page">
      <div class="flex items-center">
        <span class="${separatorClasses}">/</span>
        <span class="${finalLinkClasses.replace('hover:text-foreground', '')} ml-1 md:ml-2 text-foreground font-medium">Current Page</span>
      </div>
    </li>
  </ol>
</nav>`;

    return {
      html,
      description: `A ${style} style breadcrumb navigation${darkMode ? ' with dark mode support' : ''}${responsive ? ' and responsive design' : ''}`,
      utilities: [...baseClasses.split(' '), ...finalLinkClasses.split(' ')].filter(Boolean),
      customizations: [
        'Update links and URLs to match your site structure',
        'Customize separators (/, >, →, etc.)',
        'Add or remove breadcrumb items as needed',
        'Style the current page differently'
      ]
    };
  }

  /**
   * Validate color format
   */
  private isValidColor(color: string): boolean {
    // Check hex format
    if (/^#[0-9A-F]{6}$/i.test(color) || /^#[0-9A-F]{3}$/i.test(color)) {
      return true;
    }
    
    // Check rgb format
    if (/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i.test(color)) {
      return true;
    }
    
    // Check rgba format
    if (/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(0|1|0?\.\d+)\s*\)$/i.test(color)) {
      return true;
    }
    
    // Check hsl format
    if (/^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/i.test(color)) {
      return true;
    }
    
    return false;
  }

  /**
   * Generate color shades from base color
   */
  private generateColorShades(baseColor: string, shades: number[]): { [shade: string]: string } {
    const colors: { [shade: string]: string } = {};
    const rgb = this.hexToRgb(this.normalizeColor(baseColor));
    
    if (!rgb) {
      throw new ServiceError('Invalid color format', 'TemplateService', 'generateColorShades');
    }

    shades.forEach(shade => {
      colors[shade.toString()] = this.generateShade(rgb, shade);
    });

    return colors;
  }

  /**
   * Normalize color to hex format
   */
  private normalizeColor(color: string): string {
    // If already hex, return as is
    if (color.startsWith('#')) {
      return color.length === 4 ? this.expandHex(color) : color;
    }
    
    // Convert rgb to hex (simplified)
    const rgbMatch = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (rgbMatch) {
      const r = Math.min(255, Math.max(0, parseInt(rgbMatch[1])));
      const g = Math.min(255, Math.max(0, parseInt(rgbMatch[2])));
      const b = Math.min(255, Math.max(0, parseInt(rgbMatch[3])));
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    // Default fallback
    return '#3B82F6';
  }

  /**
   * Expand 3-digit hex to 6-digit hex
   */
  private expandHex(hex: string): string {
    return hex.replace(/^#([0-9A-F])([0-9A-F])([0-9A-F])$/i, '#$1$1$2$2$3$3');
  }

  /**
   * Convert hex to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Generate color shade
   */
  private generateShade(rgb: { r: number; g: number; b: number }, shade: number): string {
    let factor: number;
    
    if (shade === 500) {
      // Base color
      factor = 1;
    } else if (shade < 500) {
      // Lighter shades
      factor = 1 + ((500 - shade) / 500) * 0.9;
    } else {
      // Darker shades - ensure factor doesn't go below 0
      factor = Math.max(0, 1 - ((shade - 500) / 500) * 0.8);
    }

    const r = Math.round(Math.min(255, Math.max(0, rgb.r * factor)));
    const g = Math.round(Math.min(255, Math.max(0, rgb.g * factor)));
    const b = Math.round(Math.min(255, Math.max(0, rgb.b * factor)));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  /**
   * Generate CSS variables
   */
  private generateCSSVariables(name: string, colors: { [shade: string]: string }): string {
    let css = `:root {\n`;
    Object.entries(colors).forEach(([shade, color]) => {
      css += `  --color-${name}-${shade}: ${color};\n`;
    });
    css += `}`;
    return css;
  }

  /**
   * Generate Tailwind config
   */
  private generateTailwindColorConfig(name: string, colors: { [shade: string]: string }): string {
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
  }
}

type ComponentGenerator = (style: string, darkMode: boolean, responsive: boolean) => ComponentTemplate;