# TailwindCSS MCP Server

A comprehensive Model Context Protocol (MCP) server that provides TailwindCSS utilities, documentation, conversion tools, and template generation capabilities. This server enables AI assistants to help with TailwindCSS development through intelligent tooling and real-time assistance.

## 🚀 Features

### Information Tools (4 tools)
- **`get_tailwind_utilities`** - Retrieve TailwindCSS utility classes by category, property, or search
- **`get_tailwind_colors`** - Access the complete TailwindCSS color palette with all shades
- **`get_tailwind_config_guide`** - Get configuration guides for different frameworks
- **`search_tailwind_docs`** - Search TailwindCSS documentation with intelligent filtering

### Action Tools (4 tools)
- **`install_tailwind`** - Generate installation commands and configurations for any framework
- **`convert_css_to_tailwind`** - Convert traditional CSS to TailwindCSS utility classes
- **`generate_color_palette`** - Create custom color palettes with multiple shades from base colors
- **`generate_component_template`** - Generate HTML component templates with TailwindCSS classes

### Supported Frameworks
- **React** (Create React App, Next.js)
- **Vue** (Vue 3, Nuxt.js)
- **Angular**
- **Svelte/SvelteKit**
- **Laravel**
- **Vite**
- **Vanilla JavaScript/HTML**

## 📦 Installation

### Using bun (Recommended)
```bash
bun add -g @clarity-contrib/tailwindcss-mcp-server
```

### Using npm
```bash
npm install -g @clarity-contrib/tailwindcss-mcp-server
```

### Using the package directly
```bash
# With bun
bunx @clarity-contrib/tailwindcss-mcp-server

# With npx
npx @clarity-contrib/tailwindcss-mcp-server
```

### Local Development
```bash
git clone https://github.com/clarity-contrib/tailwindcss-mcp-server.git
cd tailwindcss-mcp-server
bun install
bun run build
```

## ⚙️ Configuration

### Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

#### Option 1: Using global installation
```json
{
  "mcpServers": {
    "tailwindcss-server": {
      "command": "tailwindcss-server"
    }
  }
}
```

#### Option 2: Using bunx
```json
{
  "mcpServers": {
    "tailwindcss-server": {
      "command": "bunx",
      "args": ["@clarity-contrib/tailwindcss-mcp-server"]
    }
  }
}
```

#### Option 3: Using npx
```json
{
  "mcpServers": {
    "tailwindcss-server": {
      "command": "npx",
      "args": ["-y", "@clarity-contrib/tailwindcss-mcp-server"]
    }
  }
}
```

#### Option 4: Using local build
```json
{
  "mcpServers": {
    "tailwindcss-server": {
      "command": "/path/to/tailwindcss-mcp/build/index.js"
    }
  }
}
```
### Claude Code

```bash
# Using bunx
claude mcp add tailwindcss-mcp-server -- bunx @clarity-contrib/tailwindcss-mcp-server

# Using npx
claude mcp add tailwindcss-mcp-server -- npx -y @clarity-contrib/tailwindcss-mcp-server
```

### Windsurf IDE

Add to your `./windsurf/mcp_servers.json`:
```json
{
  "mcpServers": {
    "tailwindcss-server": {
      "command": "bunx",
      "args": ["@clarity-contrib/tailwindcss-mcp-server"]
    }
  }
}
```

Or with npx:
```json
{
  "mcpServers": {
    "tailwindcss-server": {
      "command": "npx",
      "args": ["-y", "@clarity-contrib/tailwindcss-mcp-server"]
    }
  }
}
```

### Cursor IDE

Add to your `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "tailwindcss-server": {
      "command": "bunx",
      "args": ["@clarity-contrib/tailwindcss-mcp-server"]
    }
  }
}
```

Or with npx:
```json
{
  "mcpServers": {
    "tailwindcss-server": {
      "command": "npx",
      "args": ["-y", "@clarity-contrib/tailwindcss-mcp-server"]
    }
  }
}
```

## 🛠️ Tool Reference

### Information Tools

#### `get_tailwind_utilities`
Retrieve TailwindCSS utility classes with flexible filtering options.

**Parameters:**
- `category` (optional): Filter by category (e.g., 'layout', 'typography', 'colors')
- `property` (optional): Filter by CSS property (e.g., 'margin', 'color', 'font-size')
- `search` (optional): Search term to find specific utilities

**Example Usage:**
```typescript
// Get all layout utilities
get_tailwind_utilities({ category: "layout" })

// Get margin-related utilities
get_tailwind_utilities({ property: "margin" })

// Search for flex utilities
get_tailwind_utilities({ search: "flex" })
```

#### `get_tailwind_colors`
Access TailwindCSS color palette with complete shade information.

**Parameters:**
- `colorName` (optional): Specific color name (e.g., 'blue', 'red')
- `includeShades` (optional): Include all color shades (default: true)

**Example Usage:**
```typescript
// Get all colors with shades
get_tailwind_colors({ includeShades: true })

// Get specific color information
get_tailwind_colors({ colorName: "blue" })
```

#### `get_tailwind_config_guide`
Get configuration guides and best practices for different frameworks.

**Parameters:**
- `topic` (optional): Configuration topic (e.g., 'installation', 'customization')
- `framework` (optional): Target framework (e.g., 'react', 'vue', 'nextjs')

**Example Usage:**
```typescript
// Get React-specific configuration
get_tailwind_config_guide({ framework: "react" })

// Get customization guides
get_tailwind_config_guide({ topic: "customization" })
```

#### `search_tailwind_docs`
Search TailwindCSS documentation with intelligent filtering.

**Parameters:**
- `query` (required): Search query for TailwindCSS documentation
- `category` (optional): Filter by documentation category
- `limit` (optional): Limit number of results (default: 10)

**Example Usage:**
```typescript
// Search for responsive design information
search_tailwind_docs({
  query: "responsive design",
  limit: 5
})

// Search in specific category
search_tailwind_docs({
  query: "dark mode",
  category: "customization"
})
```

### Action Tools

#### `install_tailwind`
Generate complete installation commands and configuration files for any framework.

**Parameters:**
- `framework` (required): Target framework ('react', 'nextjs', 'vue', 'vite', 'laravel', 'angular', 'svelte')
- `packageManager` (optional): Package manager ('npm', 'yarn', 'pnpm', 'bun') - default: 'npm'
- `includeTypescript` (optional): Include TypeScript configuration (default: false)

**Example Usage:**
```typescript
// Install for Next.js with npm
install_tailwind({
  framework: "nextjs",
  packageManager: "npm"
})

// Install for React with TypeScript and yarn
install_tailwind({
  framework: "react",
  packageManager: "yarn",
  includeTypescript: true
})
```

#### `convert_css_to_tailwind`
Convert traditional CSS to TailwindCSS utility classes with intelligent suggestions.

**Parameters:**
- `css` (required): CSS code to convert to TailwindCSS utilities
- `mode` (optional): Output format ('classes', 'inline', 'component') - default: 'classes'

**Example Usage:**
```typescript
// Convert CSS to utility classes
convert_css_to_tailwind({
  css: ".button { padding: 1rem; background-color: #3B82F6; color: white; }"
})

// Convert with inline format
convert_css_to_tailwind({
  css: ".card { margin: 16px; border-radius: 8px; }",
  mode: "inline"
})

// Convert for @apply directive
convert_css_to_tailwind({
  css: ".component { display: flex; justify-content: center; }",
  mode: "component"
})
```

#### `generate_color_palette`
Create custom color palettes with multiple shades from a base color.

**Parameters:**
- `baseColor` (required): Base color in hex, rgb, or hsl format
- `name` (required): Name for the color palette
- `shades` (optional): Array of shade values (default: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950])

**Example Usage:**
```typescript
// Generate brand color palette
generate_color_palette({
  baseColor: "#6366F1",
  name: "brand"
})

// Generate custom shades
generate_color_palette({
  baseColor: "rgb(59, 130, 246)",
  name: "primary",
  shades: [100, 300, 500, 700, 900]
})

// Generate from HSL
generate_color_palette({
  baseColor: "hsl(217, 91%, 60%)",
  name: "accent"
})
```

#### `generate_component_template`
Generate HTML component templates with TailwindCSS classes and customization suggestions.

**Parameters:**
- `componentType` (required): Component type ('button', 'card', 'form', 'navbar', 'modal', 'alert', 'badge', 'breadcrumb')
- `style` (optional): Visual style ('minimal', 'modern', 'playful') - default: 'modern'
- `darkMode` (optional): Include dark mode support (default: false)
- `responsive` (optional): Include responsive design classes (default: true)

**Example Usage:**
```typescript
// Generate a modern button
generate_component_template({
  componentType: "button",
  style: "modern",
  responsive: true
})

// Generate a modal with dark mode
generate_component_template({
  componentType: "modal",
  style: "minimal",
  darkMode: true
})

// Generate a playful card component
generate_component_template({
  componentType: "card",
  style: "playful",
  responsive: true
})
```

## 🎯 Use Cases

### 1. Learning TailwindCSS
- Explore utility classes by category or property
- Understand the color system and naming conventions
- Get configuration examples for your framework
- Search documentation for specific concepts

### 2. Converting Existing CSS
- Convert legacy CSS to modern TailwindCSS utilities
- Get suggestions for unsupported properties
- Learn TailwindCSS equivalents for common CSS patterns
- Optimize existing stylesheets

### 3. Design System Creation
- Generate custom color palettes that match your brand
- Create consistent component templates
- Export color variables for CSS or JavaScript
- Maintain design consistency across projects

### 4. Framework Integration
- Get framework-specific installation guides
- Set up TailwindCSS with TypeScript support
- Configure build tools and development workflows
- Learn best practices for your tech stack

## 🔧 Development

### Prerequisites
- [Bun](https://bun.sh) 1.0+

### Setup
```bash
# Clone the repository
git clone https://github.com/clarity-contrib/tailwindcss-mcp-server.git
cd tailwindcss-mcp-server

# Install dependencies
bun install

# Build the project
bun run build

# Run tests
bun test

# Start development with watch mode
bun run watch
```

### Testing
```bash
# Run all tests
bun test

# Run tests with coverage
bun run test:coverage

# Run tests in watch mode
bun run test:watch

# Run tests with UI
bun run test:ui
```

### Debugging

Use the MCP Inspector for debugging and development:
```bash
bun run inspector
```

This will start the inspector and provide a URL for browser-based debugging.

## 📊 Server Capabilities

- **Real-time Documentation**: Access up-to-date TailwindCSS documentation
- **Intelligent Conversion**: Convert CSS to TailwindCSS with accuracy and suggestions
- **Framework Integration**: Support for all major frontend frameworks
- **Color Management**: Advanced color palette generation with shade variants
- **Template Generation**: Ready-to-use component templates with customization options
- **Performance Optimized**: Efficient caching and service architecture
- **Error Handling**: Comprehensive error handling with helpful messages
- **Type Safety**: Full TypeScript implementation with proper typing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- [TailwindCSS Official Documentation](https://tailwindcss.com)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Claude Desktop](https://claude.ai)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)