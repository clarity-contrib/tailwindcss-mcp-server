/**
 * Utility functions for TailwindCSS MCP Server
 */

/**
 * Validates if a string is a valid CSS color
 */
export function isValidCSSColor(color: string): boolean {
  // Basic validation for common color formats
  const colorRegex = /^(#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)|hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)|hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\))$/;
  return colorRegex.test(color);
}

/**
 * Converts a hex color to RGB components
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

/**
 * Generates color shades for a given base color
 */
export function generateColorShades(baseColor: string, shadeCount: number = 9): Record<string, string> {
  const shades: Record<string, string> = {};
  const shadeKeys = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
  
  // Simple shade generation - in production, you'd use a more sophisticated color theory approach
  const rgb = hexToRgb(baseColor);
  if (!rgb) return shades;

  shadeKeys.slice(0, shadeCount).forEach((key, index) => {
    const factor = (500 - parseInt(key)) / 500; // Base at 500
    const r = Math.round(Math.max(0, Math.min(255, rgb.r + factor * (255 - rgb.r))));
    const g = Math.round(Math.max(0, Math.min(255, rgb.g + factor * (255 - rgb.g))));
    const b = Math.round(Math.max(0, Math.min(255, rgb.b + factor * (255 - rgb.b))));
    
    shades[key] = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  });

  return shades;
}

/**
 * Normalizes a framework name to a standard format
 */
export function normalizeFrameworkName(framework: string): string {
  const frameworkMap: Record<string, string> = {
    'nextjs': 'next',
    'next.js': 'next',
    'reactjs': 'react',
    'react.js': 'react',
    'vuejs': 'vue',
    'vue.js': 'vue',
    'vitejs': 'vite',
    'vite.js': 'vite',
  };

  const normalized = framework.toLowerCase();
  return frameworkMap[normalized] || normalized;
}

/**
 * Validates a TailwindCSS class name format
 */
export function isValidTailwindClass(className: string): boolean {
  // Basic validation for Tailwind class format
  const tailwindClassRegex = /^([a-z]+(-[a-z0-9]+)*:)?[a-z]+(-[a-z0-9]+)*(\[.*\])?$/;
  return tailwindClassRegex.test(className);
}

/**
 * Extracts responsive prefix from a TailwindCSS class
 */
export function extractResponsivePrefix(className: string): { prefix: string | null; baseClass: string } {
  const responsivePrefixes = ['sm:', 'md:', 'lg:', 'xl:', '2xl:'];
  
  for (const prefix of responsivePrefixes) {
    if (className.startsWith(prefix)) {
      return {
        prefix: prefix.slice(0, -1), // Remove the colon
        baseClass: className.slice(prefix.length),
      };
    }
  }

  return { prefix: null, baseClass: className };
}

/**
 * Debounces a function call
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
}

/**
 * Creates a deep clone of an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item)) as unknown as T;
  }

  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }

  return cloned;
}