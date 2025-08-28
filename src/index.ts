#!/usr/bin/env node

/**
 * MCP server for TailwindCSS utility references
 * This server provides tools to:
 * - Get TailwindCSS utilities by category or property
 * - Get TailwindCSS color information
 * - Get configuration guides for frameworks
 * - Search TailwindCSS documentation
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { initializeServices } from './services/index.js';
import type { 
  GetUtilitiesParams,
  GetColorsParams,
  ConfigGuideParams,
  SearchDocsParams,
  TailwindUtility,
  ColorInfo,
  ConfigGuide,
  SearchResult
} from './types/index.js';

/**
 * TailwindCSSServer class that handles all the TailwindCSS information functionality
 */
export class TailwindCSSServer {
  private server: Server;
  private documentationScraper: any;
  private utilityMapper: any;

  constructor() {
    this.server = new Server(
      {
        name: "tailwindcss-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();

    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Initialize the server with services
   */
  async initialize() {
    const services = await initializeServices();
    this.documentationScraper = services.documentationScraper;
    this.utilityMapper = services.utilityMapper;
  }

  /**
   * Set up the tool handlers for the server
   */
  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "get_tailwind_utilities",
          description: "Get TailwindCSS utilities by category, property, or search term",
          inputSchema: {
            type: "object",
            properties: {
              category: {
                type: "string",
                description: "Filter by utility category (e.g., 'layout', 'typography', 'colors')",
              },
              property: {
                type: "string", 
                description: "Filter by CSS property (e.g., 'margin', 'color', 'font-size')",
              },
              search: {
                type: "string",
                description: "Search term to find utilities",
              },
            },
            required: [],
          },
        },
        {
          name: "get_tailwind_colors",
          description: "Get TailwindCSS color palette information",
          inputSchema: {
            type: "object",
            properties: {
              colorName: {
                type: "string",
                description: "Specific color name (e.g., 'blue', 'red')",
              },
              includeShades: {
                type: "boolean",
                description: "Include all color shades (default: true)",
              },
            },
            required: [],
          },
        },
        {
          name: "get_tailwind_config_guide",
          description: "Get TailwindCSS configuration guides for different frameworks",
          inputSchema: {
            type: "object",
            properties: {
              topic: {
                type: "string",
                description: "Configuration topic (e.g., 'installation', 'customization')",
              },
              framework: {
                type: "string",
                description: "Target framework (e.g., 'react', 'vue', 'nextjs')",
              },
            },
            required: [],
          },
        },
        {
          name: "search_tailwind_docs",
          description: "Search TailwindCSS documentation",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query for TailwindCSS documentation",
              },
              category: {
                type: "string",
                description: "Filter by documentation category",
              },
              limit: {
                type: "number",
                description: "Limit number of results (default: 10)",
              },
            },
            required: ["query"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case "get_tailwind_utilities":
          return await this.handleGetTailwindUtilities(request.params.arguments);
        case "get_tailwind_colors":
          return await this.handleGetTailwindColors(request.params.arguments);
        case "get_tailwind_config_guide":
          return await this.handleGetTailwindConfigGuide(request.params.arguments);
        case "search_tailwind_docs":
          return await this.handleSearchTailwindDocs(request.params.arguments);
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }

  /**
   * Handle the get_tailwind_utilities tool request
   */
  private async handleGetTailwindUtilities(args: any): Promise<any> {
    try {
      const params = this.validateGetUtilitiesParams(args);
      const utilities = await this.utilityMapper.getUtilities(params);
      return this.createSuccessResponse(utilities);
    } catch (error) {
      this.handleServiceError(error, "Failed to get TailwindCSS utilities");
    }
  }

  /**
   * Validates get utilities parameters
   */
  private validateGetUtilitiesParams(args: any): GetUtilitiesParams {
    const params: GetUtilitiesParams = {};
    
    if (args?.category && typeof args.category === "string") {
      params.category = args.category;
    }
    
    if (args?.property && typeof args.property === "string") {
      params.property = args.property;
    }
    
    if (args?.search && typeof args.search === "string") {
      params.search = args.search;
    }
    
    return params;
  }

  /**
   * Validates get colors parameters
   */
  private validateGetColorsParams(args: any): GetColorsParams {
    const params: GetColorsParams = {};
    
    if (args?.colorName && typeof args.colorName === "string") {
      params.colorName = args.colorName;
    }
    
    if (args?.includeShades !== undefined) {
      params.includeShades = Boolean(args.includeShades);
    }
    
    return params;
  }

  /**
   * Validates config guide parameters
   */
  private validateConfigGuideParams(args: any): ConfigGuideParams {
    const params: ConfigGuideParams = {};
    
    if (args?.topic && typeof args.topic === "string") {
      params.topic = args.topic;
    }
    
    if (args?.framework && typeof args.framework === "string") {
      params.framework = args.framework;
    }
    
    return params;
  }

  /**
   * Validates search docs parameters
   */
  private validateSearchDocsParams(args: any): SearchDocsParams {
    if (!args?.query || typeof args.query !== "string") {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Search query is required and must be a string"
      );
    }
    
    const params: SearchDocsParams = {
      query: args.query,
    };
    
    if (args?.category && typeof args.category === "string") {
      params.category = args.category;
    }
    
    if (args?.limit && typeof args.limit === "number" && args.limit > 0) {
      params.limit = args.limit;
    }
    
    return params;
  }

  /**
   * Handles service errors consistently
   */
  private handleServiceError(error: unknown, context: string): never {
    console.error(`Service error during "${context}":`, error);
    
    if (error instanceof McpError) {
      throw error;
    }
    
    // Wrap other errors as internal errors
    throw new McpError(
      ErrorCode.InternalError,
      `An unexpected error occurred during "${context}".`
    );
  }


  /**
   * Handle the get_tailwind_colors tool request
   */
  private async handleGetTailwindColors(args: any): Promise<any> {
    try {
      const params = this.validateGetColorsParams(args);
      const colors = await this.utilityMapper.getColors(params);
      return this.createSuccessResponse(colors);
    } catch (error) {
      this.handleServiceError(error, "Failed to get TailwindCSS colors");
    }
  }

  /**
   * Handle the get_tailwind_config_guide tool request
   */
  private async handleGetTailwindConfigGuide(args: any): Promise<any> {
    try {
      const params = this.validateConfigGuideParams(args);
      const guide = await this.documentationScraper.getConfigGuide(params);
      return this.createSuccessResponse(guide);
    } catch (error) {
      this.handleServiceError(error, "Failed to get TailwindCSS config guide");
    }
  }

  /**
   * Handle the search_tailwind_docs tool request
   */
  private async handleSearchTailwindDocs(args: any): Promise<any> {
    try {
      const params = this.validateSearchDocsParams(args);
      const results = await this.documentationScraper.searchDocumentation(params);
      return this.createSuccessResponse(results);
    } catch (error) {
      this.handleServiceError(error, "Failed to search TailwindCSS documentation");
    }
  }

  /**
   * Creates a standardized success response
   */
  private createSuccessResponse(data: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2)
        },
      ],
    };
  }


  /**
   * Run the server
   */
  async run() {
    await this.initialize();
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("TailwindCSS MCP server running on stdio");
  }
}

// Create and run the server
const server = new TailwindCSSServer();
server.run().catch((error) => {
  console.error("Server failed to run:", error);
  process.exit(1);
}); 