/**
 * MCP (Model Context Protocol) Mock utilities for testing MCP server interactions
 */

import { vi } from 'vitest';

export interface MockMCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface MockMCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MockMCPRequest {
  method: string;
  params: any;
}

export interface MockMCPResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

class MCPMockManager {
  private toolResponses: Map<string, any> = new Map();
  private resourceResponses: Map<string, any> = new Map();
  private requestHistory: MockMCPRequest[] = [];

  /**
   * Mock a tool response
   */
  mockTool(toolName: string, response: any, shouldError: boolean = false): void {
    this.toolResponses.set(toolName, {
      response,
      shouldError,
    });
  }

  /**
   * Mock a resource response  
   */
  mockResource(uri: string, response: any): void {
    this.resourceResponses.set(uri, response);
  }

  /**
   * Get mock response for a tool call
   */
  getToolResponse(toolName: string, params: any): MockMCPResponse {
    const mock = this.toolResponses.get(toolName);
    if (!mock) {
      return {
        error: {
          code: -32601,
          message: `Method not found: ${toolName}`,
        },
      };
    }

    this.recordRequest('tools/call', { name: toolName, arguments: params });

    if (mock.shouldError) {
      return {
        error: {
          code: -32603,
          message: 'Internal error',
          data: mock.response,
        },
      };
    }

    return { result: mock.response };
  }

  /**
   * Get mock response for a resource
   */
  getResourceResponse(uri: string): MockMCPResponse {
    const response = this.resourceResponses.get(uri);
    if (!response) {
      return {
        error: {
          code: -32602,
          message: `Resource not found: ${uri}`,
        },
      };
    }

    this.recordRequest('resources/read', { uri });
    return { result: response };
  }

  /**
   * Record a request for testing purposes
   */
  recordRequest(method: string, params: any): void {
    this.requestHistory.push({ method, params });
  }

  /**
   * Get request history
   */
  getRequestHistory(): MockMCPRequest[] {
    return [...this.requestHistory];
  }

  /**
   * Check if a specific request was made
   */
  wasRequestMade(method: string, paramsMatcher?: (params: any) => boolean): boolean {
    return this.requestHistory.some(req => {
      if (req.method !== method) return false;
      if (paramsMatcher && !paramsMatcher(req.params)) return false;
      return true;
    });
  }

  /**
   * Clear all mocks and history
   */
  clear(): void {
    this.toolResponses.clear();
    this.resourceResponses.clear();
    this.requestHistory.length = 0;
  }

  /**
   * Clear only request history
   */
  clearHistory(): void {
    this.requestHistory.length = 0;
  }
}

// Global MCP mock manager
export const mcpMock = new MCPMockManager();

/**
 * Mock MCP Server for testing
 */
export class MockMCPServer {
  private tools: Map<string, MockMCPTool> = new Map();
  private resources: Map<string, MockMCPResource> = new Map();

  /**
   * Add a mock tool
   */
  addTool(tool: MockMCPTool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Add a mock resource
   */
  addResource(resource: MockMCPResource): void {
    this.resources.set(resource.uri, resource);
  }

  /**
   * List available tools
   */
  listTools(): MockMCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * List available resources
   */
  listResources(): MockMCPResource[] {
    return Array.from(this.resources.values());
  }

  /**
   * Call a tool
   */
  callTool(name: string, params: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    const response = mcpMock.getToolResponse(name, params);
    if (response.error) {
      throw new Error(response.error.message);
    }

    return Promise.resolve(response.result);
  }

  /**
   * Read a resource
   */
  readResource(uri: string): Promise<any> {
    const resource = this.resources.get(uri);
    if (!resource) {
      throw new Error(`Resource not found: ${uri}`);
    }

    const response = mcpMock.getResourceResponse(uri);
    if (response.error) {
      throw new Error(response.error.message);
    }

    return Promise.resolve(response.result);
  }

  /**
   * Clear all tools and resources
   */
  clear(): void {
    this.tools.clear();
    this.resources.clear();
  }
}

/**
 * Create a mock MCP server with common tools pre-configured
 */
export const createMockMCPServer = (): MockMCPServer => {
  const server = new MockMCPServer();

  // Add common TailwindCSS MCP tools
  server.addTool({
    name: 'get-utilities',
    description: 'Get TailwindCSS utility classes',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string' },
        property: { type: 'string' },
        search: { type: 'string' },
      },
    },
  });

  server.addTool({
    name: 'search-docs',
    description: 'Search TailwindCSS documentation',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        category: { type: 'string' },
        limit: { type: 'number' },
      },
      required: ['query'],
    },
  });

  server.addTool({
    name: 'convert-css',
    description: 'Convert CSS to TailwindCSS utility classes',
    inputSchema: {
      type: 'object',
      properties: {
        css: { type: 'string' },
        mode: { type: 'string', enum: ['inline', 'classes', 'component'] },
      },
      required: ['css'],
    },
  });

  return server;
};