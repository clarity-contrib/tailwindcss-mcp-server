# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript-based MCP (Model Context Protocol) server for TailwindCSS, providing comprehensive tools for AI agents to understand and work with the TailwindCSS utility-first framework. The server offers both informational tools (documentation, utilities, configuration) and action tools (installation, CSS conversion, component generation).

## Development Commands

### Build & Development
- `bun install` - Install dependencies
- `bun run build` - Build TypeScript to JavaScript and set executable permissions
- `bun run watch` - Watch mode for development (auto-rebuilds on file changes)

### Testing & Debugging
- `bun run test` or `bunx vitest run` - Run all tests
- `bun run inspector` - Launch MCP Inspector for debugging the server through a web interface

### Publishing
- `bun publish` - Publish to npm (auto-builds via `prepare` script)
- Always use `bun` for all package management — never npm/yarn/pnpm

## Architecture & Key Components

### Project Goals
1. **Primary**: Enable AI agents to provide accurate TailwindCSS guidance by accessing comprehensive documentation, utility classes, and configuration patterns
2. **Secondary**: Execute practical actions like installing TailwindCSS, converting CSS to utilities, generating color palettes, and creating component templates

### Planned MCP Tools

**Information Tools**:
- `get_tailwind_utilities` - Retrieve utility class information by category (spacing, colors, typography, etc.)
- `get_tailwind_colors` - Access the complete color palette with shades
- `get_tailwind_config_guide` - Framework-specific configuration guidance
- `search_tailwind_docs` - Full-text search across documentation

**Action Tools**:
- `install_tailwind` - Generate installation commands for any framework
- `convert_css_to_tailwind` - Convert traditional CSS to utility classes
- `generate_color_palette` - Create custom color schemes
- `analyze_tailwind_usage` - Audit and optimize TailwindCSS usage in projects
- `generate_component_template` - Create HTML templates with TailwindCSS utilities

### Technical Implementation

- **Web Scraping**: Uses axios for HTTP requests and cheerio for HTML parsing from https://tailwindcss.com/docs/
- **Caching Strategy**: Multi-level cache (memory, file, remote) for documentation and utility mappings
- **CSS Processing**: PostCSS integration for CSS-to-Tailwind conversion
- **Error Handling**: MCP-specific error codes with graceful degradation

### Key Data Sources
- TailwindCSS official documentation (primary)
- Cached utility class mappings
- Framework-specific templates and configurations

## TypeScript Configuration

The project uses ES2022 target with Node16 module system, strict type checking enabled, and outputs to `./build` directory.

## Implementation Status

Currently transitioning from FluxUI component server to TailwindCSS utility server. See `TAILWINDCSS_MCP_IMPLEMENTATION_PLAN.md` for detailed implementation roadmap.