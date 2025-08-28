/**
 * Sample TailwindCSS documentation fixtures for testing
 */

export const sampleTailwindDocsHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Padding - Tailwind CSS</title>
</head>
<body>
    <main>
        <h1>Padding</h1>
        <p>Utilities for controlling an element's padding.</p>
        
        <div class="docs-section">
            <h2>Basic usage</h2>
            <h3>Add padding to a single side</h3>
            <pre><code>
&lt;div class="pt-6"&gt;pt-6&lt;/div&gt;
&lt;div class="pr-4"&gt;pr-4&lt;/div&gt;
&lt;div class="pb-8"&gt;pb-8&lt;/div&gt;
&lt;div class="pl-2"&gt;pl-2&lt;/div&gt;
            </code></pre>
            
            <h3>Add horizontal padding</h3>
            <pre><code>
&lt;div class="px-8"&gt;px-8&lt;/div&gt;
            </code></pre>
            
            <h3>Add vertical padding</h3>
            <pre><code>
&lt;div class="py-8"&gt;py-8&lt;/div&gt;
            </code></pre>
        </div>
        
        <div class="docs-section">
            <h2>Applying conditionally</h2>
            <h3>Hover, focus, and other states</h3>
            <pre><code>
&lt;div class="p-4 hover:p-6"&gt;
  Hover to increase padding
&lt;/div&gt;
            </code></pre>
        </div>
        
        <nav class="docs-nav">
            <a href="/docs/margin">Margin</a>
            <a href="/docs/space">Space Between</a>
            <a href="/docs/width">Width</a>
            <a href="/docs/height">Height</a>
        </nav>
    </main>
</body>
</html>
`;

export const sampleDocsIndexHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Documentation - Tailwind CSS</title>
</head>
<body>
    <nav class="docs-navigation">
        <div class="category">
            <h3>Layout</h3>
            <ul>
                <li><a href="/docs/aspect-ratio">Aspect Ratio</a></li>
                <li><a href="/docs/container">Container</a></li>
                <li><a href="/docs/columns">Columns</a></li>
                <li><a href="/docs/break-after">Break After</a></li>
                <li><a href="/docs/break-before">Break Before</a></li>
                <li><a href="/docs/break-inside">Break Inside</a></li>
                <li><a href="/docs/box-decoration-break">Box Decoration Break</a></li>
                <li><a href="/docs/box-sizing">Box Sizing</a></li>
                <li><a href="/docs/display">Display</a></li>
                <li><a href="/docs/float">Float</a></li>
                <li><a href="/docs/clear">Clear</a></li>
                <li><a href="/docs/isolation">Isolation</a></li>
                <li><a href="/docs/object-fit">Object Fit</a></li>
                <li><a href="/docs/object-position">Object Position</a></li>
                <li><a href="/docs/overflow">Overflow</a></li>
                <li><a href="/docs/overscroll-behavior">Overscroll Behavior</a></li>
                <li><a href="/docs/position">Position</a></li>
                <li><a href="/docs/top-right-bottom-left">Top / Right / Bottom / Left</a></li>
                <li><a href="/docs/visibility">Visibility</a></li>
                <li><a href="/docs/z-index">Z-Index</a></li>
            </ul>
        </div>
        
        <div class="category">
            <h3>Spacing</h3>
            <ul>
                <li><a href="/docs/padding">Padding</a></li>
                <li><a href="/docs/margin">Margin</a></li>
                <li><a href="/docs/space">Space Between</a></li>
            </ul>
        </div>
        
        <div class="category">
            <h3>Sizing</h3>
            <ul>
                <li><a href="/docs/width">Width</a></li>
                <li><a href="/docs/min-width">Min-Width</a></li>
                <li><a href="/docs/max-width">Max-Width</a></li>
                <li><a href="/docs/height">Height</a></li>
                <li><a href="/docs/min-height">Min-Height</a></li>
                <li><a href="/docs/max-height">Max-Height</a></li>
                <li><a href="/docs/size">Size</a></li>
            </ul>
        </div>
        
        <div class="category">
            <h3>Typography</h3>
            <ul>
                <li><a href="/docs/font-family">Font Family</a></li>
                <li><a href="/docs/font-size">Font Size</a></li>
                <li><a href="/docs/font-smoothing">Font Smoothing</a></li>
                <li><a href="/docs/font-style">Font Style</a></li>
                <li><a href="/docs/font-weight">Font Weight</a></li>
                <li><a href="/docs/font-variant-numeric">Font Variant Numeric</a></li>
                <li><a href="/docs/letter-spacing">Letter Spacing</a></li>
                <li><a href="/docs/line-height">Line Height</a></li>
                <li><a href="/docs/list-style-position">List Style Position</a></li>
                <li><a href="/docs/list-style-type">List Style Type</a></li>
                <li><a href="/docs/text-align">Text Align</a></li>
                <li><a href="/docs/text-color">Text Color</a></li>
                <li><a href="/docs/text-decoration">Text Decoration</a></li>
                <li><a href="/docs/text-decoration-color">Text Decoration Color</a></li>
                <li><a href="/docs/text-decoration-style">Text Decoration Style</a></li>
                <li><a href="/docs/text-decoration-thickness">Text Decoration Thickness</a></li>
                <li><a href="/docs/text-underline-offset">Text Underline Offset</a></li>
                <li><a href="/docs/text-transform">Text Transform</a></li>
                <li><a href="/docs/text-overflow">Text Overflow</a></li>
                <li><a href="/docs/text-wrap">Text Wrap</a></li>
                <li><a href="/docs/text-indent">Text Indent</a></li>
                <li><a href="/docs/vertical-align">Vertical Align</a></li>
                <li><a href="/docs/whitespace">Whitespace</a></li>
                <li><a href="/docs/word-break">Word Break</a></li>
                <li><a href="/docs/hyphens">Hyphens</a></li>
                <li><a href="/docs/content">Content</a></li>
            </ul>
        </div>
    </nav>
</body>
</html>
`;

export const sampleUtilityData = {
  padding: {
    id: 'padding',
    name: 'Padding',
    category: {
      id: 'spacing',
      name: 'Spacing',
      description: 'Utilities for controlling spacing around and within elements',
      utilities: ['padding', 'margin', 'space'],
    },
    cssProperty: 'padding',
    values: [
      { class: 'p-0', value: '0px', isDefault: false },
      { class: 'p-px', value: '1px', isDefault: false },
      { class: 'p-0.5', value: '0.125rem', isDefault: false },
      { class: 'p-1', value: '0.25rem', isDefault: false },
      { class: 'p-1.5', value: '0.375rem', isDefault: false },
      { class: 'p-2', value: '0.5rem', isDefault: false },
      { class: 'p-2.5', value: '0.625rem', isDefault: false },
      { class: 'p-3', value: '0.75rem', isDefault: false },
      { class: 'p-3.5', value: '0.875rem', isDefault: false },
      { class: 'p-4', value: '1rem', isDefault: true },
      { class: 'p-5', value: '1.25rem', isDefault: false },
      { class: 'p-6', value: '1.5rem', isDefault: false },
      { class: 'p-7', value: '1.75rem', isDefault: false },
      { class: 'p-8', value: '2rem', isDefault: false },
      { class: 'p-9', value: '2.25rem', isDefault: false },
      { class: 'p-10', value: '2.5rem', isDefault: false },
      { class: 'p-11', value: '2.75rem', isDefault: false },
      { class: 'p-12', value: '3rem', isDefault: false },
      { class: 'p-14', value: '3.5rem', isDefault: false },
      { class: 'p-16', value: '4rem', isDefault: false },
      { class: 'p-20', value: '5rem', isDefault: false },
      { class: 'p-24', value: '6rem', isDefault: false },
      { class: 'p-28', value: '7rem', isDefault: false },
      { class: 'p-32', value: '8rem', isDefault: false },
      { class: 'p-36', value: '9rem', isDefault: false },
      { class: 'p-40', value: '10rem', isDefault: false },
      { class: 'p-44', value: '11rem', isDefault: false },
      { class: 'p-48', value: '12rem', isDefault: false },
      { class: 'p-52', value: '13rem', isDefault: false },
      { class: 'p-56', value: '14rem', isDefault: false },
      { class: 'p-60', value: '15rem', isDefault: false },
      { class: 'p-64', value: '16rem', isDefault: false },
      { class: 'p-72', value: '18rem', isDefault: false },
      { class: 'p-80', value: '20rem', isDefault: false },
      { class: 'p-96', value: '24rem', isDefault: false },
    ],
    modifiers: [
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
        type: 'responsive',
        prefix: 'xl:',
        description: 'Apply on extra large screens and up',
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
    ],
    examples: [
      {
        title: 'Basic padding',
        code: '<div class="p-4">Content with padding</div>',
        description: 'Adds 1rem padding to all sides',
      },
      {
        title: 'Directional padding',
        code: '<div class="pt-4 pr-2 pb-4 pl-2">Content</div>',
        description: 'Different padding for each side',
      },
      {
        title: 'Responsive padding',
        code: '<div class="p-4 md:p-8">Content</div>',
        description: 'Responsive padding that changes on medium screens',
      },
    ],
    documentation: 'Utilities for controlling an element\'s padding.',
  },
  
  width: {
    id: 'width',
    name: 'Width',
    category: {
      id: 'sizing',
      name: 'Sizing',
      description: 'Utilities for controlling element dimensions',
      utilities: ['width', 'height', 'min-width', 'max-width'],
    },
    cssProperty: 'width',
    values: [
      { class: 'w-0', value: '0px', isDefault: false },
      { class: 'w-px', value: '1px', isDefault: false },
      { class: 'w-0.5', value: '0.125rem', isDefault: false },
      { class: 'w-1', value: '0.25rem', isDefault: false },
      { class: 'w-auto', value: 'auto', isDefault: true },
      { class: 'w-1/2', value: '50%', isDefault: false },
      { class: 'w-1/3', value: '33.333333%', isDefault: false },
      { class: 'w-2/3', value: '66.666667%', isDefault: false },
      { class: 'w-1/4', value: '25%', isDefault: false },
      { class: 'w-3/4', value: '75%', isDefault: false },
      { class: 'w-full', value: '100%', isDefault: false },
      { class: 'w-screen', value: '100vw', isDefault: false },
      { class: 'w-svw', value: '100svw', isDefault: false },
      { class: 'w-lvw', value: '100lvw', isDefault: false },
      { class: 'w-dvw', value: '100dvw', isDefault: false },
      { class: 'w-min', value: 'min-content', isDefault: false },
      { class: 'w-max', value: 'max-content', isDefault: false },
      { class: 'w-fit', value: 'fit-content', isDefault: false },
    ],
    modifiers: [
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
    ],
    examples: [
      {
        title: 'Fixed width',
        code: '<div class="w-64">Fixed width content</div>',
        description: 'Sets width to 16rem',
      },
      {
        title: 'Responsive width',
        code: '<div class="w-full md:w-1/2">Responsive width</div>',
        description: 'Full width on mobile, half width on medium screens and up',
      },
    ],
    documentation: 'Utilities for controlling an element\'s width.',
  },
};

export const sampleColorData = {
  slate: {
    name: 'slate',
    shades: {
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
      '950': '#020617',
    },
    usage: [
      'text-slate-50', 'text-slate-100', 'text-slate-200', 'text-slate-300',
      'text-slate-400', 'text-slate-500', 'text-slate-600', 'text-slate-700',
      'text-slate-800', 'text-slate-900', 'text-slate-950',
      'bg-slate-50', 'bg-slate-100', 'bg-slate-200', 'bg-slate-300',
      'bg-slate-400', 'bg-slate-500', 'bg-slate-600', 'bg-slate-700',
      'bg-slate-800', 'bg-slate-900', 'bg-slate-950',
      'border-slate-50', 'border-slate-100', 'border-slate-200', 'border-slate-300',
      'border-slate-400', 'border-slate-500', 'border-slate-600', 'border-slate-700',
      'border-slate-800', 'border-slate-900', 'border-slate-950',
    ],
  },
  
  blue: {
    name: 'blue',
    shades: {
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
      '950': '#172554',
    },
    usage: [
      'text-blue-50', 'text-blue-100', 'text-blue-200', 'text-blue-300',
      'text-blue-400', 'text-blue-500', 'text-blue-600', 'text-blue-700',
      'text-blue-800', 'text-blue-900', 'text-blue-950',
      'bg-blue-50', 'bg-blue-100', 'bg-blue-200', 'bg-blue-300',
      'bg-blue-400', 'bg-blue-500', 'bg-blue-600', 'bg-blue-700',
      'bg-blue-800', 'bg-blue-900', 'bg-blue-950',
      'border-blue-50', 'border-blue-100', 'border-blue-200', 'border-blue-300',
      'border-blue-400', 'border-blue-500', 'border-blue-600', 'border-blue-700',
      'border-blue-800', 'border-blue-900', 'border-blue-950',
    ],
  },
};

export const sampleSearchResults = [
  {
    title: 'Padding',
    url: 'https://tailwindcss.com/docs/padding',
    snippet: 'Utilities for controlling an element\'s padding.',
    relevance: 1.0,
  },
  {
    title: 'Margin',
    url: 'https://tailwindcss.com/docs/margin',
    snippet: 'Utilities for controlling an element\'s margin.',
    relevance: 0.8,
  },
  {
    title: 'Space Between',
    url: 'https://tailwindcss.com/docs/space',
    snippet: 'Utilities for controlling the space between child elements.',
    relevance: 0.6,
  },
];

export const sampleCSSConversions = {
  input: `
    .custom-card {
      padding: 1rem;
      margin: 0.5rem;
      background-color: #3b82f6;
      border-radius: 0.5rem;
      color: white;
    }
  `,
  expected: {
    tailwindClasses: 'p-4 m-2 bg-blue-500 rounded-lg text-white',
    unsupportedStyles: undefined,
    suggestions: undefined,
  },
};

export const sampleArbitraryCSSConversions = {
  input: `
    .custom-element {
      padding: 1.75rem;
      margin-top: 3.25rem;
      width: 425px;
      font-size: 1.1rem;
    }
  `,
  expected: {
    tailwindClasses: 'p-[1.75rem] mt-[3.25rem] w-[425px] text-[1.1rem]',
    unsupportedStyles: undefined,
    suggestions: [
      'Consider using p-[1.75rem] for padding: 1.75rem',
      'Consider using mt-[3.25rem] for margin-top: 3.25rem',
      'Consider using w-[425px] for width: 425px',
      'Consider using text-[1.1rem] for font-size: 1.1rem',
    ],
  },
};