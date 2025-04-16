#!/usr/bin/env node

/**
 * MCP server for Flux UI component references
 * This server provides tools to:
 * - List all available Flux UI components
 * - Get detailed information about specific components
 * - Get usage examples for components
 * - Search for components by keyword
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import * as cheerio from "cheerio";
import { Element } from 'domhandler';

/**
 * Interface for component information
 */
interface ComponentInfo {
  name: string;
  description: string;
  url: string;
  importStatement?: string;
  props?: Record<string, ComponentProp[]>; // Component name -> Props list
  examples?: ComponentExample[];
}

/**
 * Interface for component property information
 */
interface ComponentProp {
  name: string; // Renamed from 'prop' for clarity if needed elsewhere
  type: string;
  default?: string;
  description?: string; // Flux UI seems to sometimes have descriptions in API tables
  required?: boolean; // May need to infer this or look for specific markers
}

/**
 * Interface for component example
 */
interface ComponentExample {
  title: string;
  code: string;
  description?: string;
}

/**
 * FluxUiServer class that handles all the component reference functionality
 */
class FluxUiServer {
  private server: Server;
  private axiosInstance;
  private componentCache: Map<string, ComponentInfo> = new Map();
  private componentsListCache: ComponentInfo[] | null = null;
  private readonly FLUX_DOCS_URL = "https://fluxui.dev";

  constructor() {
    this.server = new Server(
      {
        name: "fluxui-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.axiosInstance = axios.create({
      timeout: 15000, // Increased timeout slightly
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FluxUiMcpServer/0.1.0)",
      },
    });

    this.setupToolHandlers();

    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Set up the tool handlers for the server
   */
  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "list_flux_components",
          description: "Get a list of all available Flux UI components",
          inputSchema: {
            type: "object",
            properties: {},
            required: [],
          },
        },
        {
          name: "get_flux_component_details",
          description: "Get detailed information about a specific Flux UI component",
          inputSchema: {
            type: "object",
            properties: {
              componentName: {
                type: "string",
                description: 'Name of the Flux UI component (e.g., "accordion", "button")',
              },
            },
            required: ["componentName"],
          },
        },
        {
          name: "get_flux_component_examples",
          description: "Get usage examples for a specific Flux UI component",
          inputSchema: {
            type: "object",
            properties: {
              componentName: {
                type: "string",
                description: 'Name of the Flux UI component (e.g., "accordion", "button")',
              },
            },
            required: ["componentName"],
          },
        },
        {
          name: "search_flux_components",
          description: "Search for Flux UI components by keyword",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query to find relevant components",
              },
            },
            required: ["query"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case "list_flux_components":
          return await this.handleListComponents();
        case "get_flux_component_details":
          return await this.handleGetComponentDetails(request.params.arguments);
        case "get_flux_component_examples":
          return await this.handleGetComponentExamples(request.params.arguments);
        case "search_flux_components":
          return await this.handleSearchComponents(request.params.arguments);
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }

  /**
   * Handle the list_flux_components tool request
   */
  private async handleListComponents() {
    try {
      if (!this.componentsListCache) {
        // Fetch the main components page or sidebar structure
        // This needs inspection of fluxui.dev to find the component list reliably
        // Let's assume we fetch the base URL and look for links starting with /components/
        const response = await this.axiosInstance.get(`${this.FLUX_DOCS_URL}/components`);
        const $ = cheerio.load(response.data);

        const components: ComponentInfo[] = [];
        const componentUrls = new Set<string>(); // Avoid duplicates

        // Look for links within the navigation or main content area
        // Adjust selector based on actual site structure
        $('a[href^="/components/"]').each((_, element) => {
          const link = $(element);
          const url = link.attr("href");

          if (url && url !== "/components" && !componentUrls.has(url)) {
             // Basic check to avoid the parent page
             // Extract name from URL
            const parts = url.split("/").filter(part => part); // filter removes empty strings
            const name = parts[parts.length - 1];

            if (name && !name.includes('#')) { // Basic check for valid component name
              componentUrls.add(url);
              components.push({
                name,
                description: "", // Will be populated when fetching details
                url: `${this.FLUX_DOCS_URL}${url}`,
              });
            }
          }
        });

        // Sort components alphabetically by name
        components.sort((a, b) => a.name.localeCompare(b.name));

        this.componentsListCache = components;
      }

      return this.createSuccessResponse(
          this.componentsListCache.map(c => ({ name: c.name, url: c.url })) // Return only name and URL for list
        );

    } catch (error) {
       this.handleAxiosError(error, "Failed to fetch Flux UI components list");
    }
  }

  /**
   * Validates component name from arguments
   */
  private validateComponentName(args: any): string {
    if (!args?.componentName || typeof args.componentName !== "string") {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Component name is required and must be a string"
      );
    }
    // Normalize component name if needed (e.g., lowercase)
    return args.componentName.toLowerCase();
  }

  /**
   * Validates search query from arguments
   */
  private validateSearchQuery(args: any): string {
    if (!args?.query || typeof args.query !== "string") {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Search query is required and must be a string"
      );
    }
    return args.query.toLowerCase();
  }

  /**
   * Handles Axios errors consistently
   */
  private handleAxiosError(error: unknown, context: string): never {
    if (axios.isAxiosError(error)) {
      console.error(`Axios error during "${context}": ${error.message}`, error.response?.status, error.config?.url);
      if (error.response?.status === 404) {
        throw new McpError(
          ErrorCode.InvalidParams, // Use InvalidParams for 404 instead of NotFound
          `${context} - Resource not found (404)`
        );
      } else {
         const status = error.response?.status || 'N/A';
         const message = error.message;
        throw new McpError(
          ErrorCode.InternalError,
           `Failed during "${context}" operation. Status: ${status}. Error: ${message}`
        );
      }
    }
     console.error(`Non-Axios error during "${context}":`, error);
    // Re-throw non-Axios errors or wrap them if needed
    throw error instanceof McpError ? error : new McpError(ErrorCode.InternalError, `An unexpected error occurred during "${context}".`);
  }


  /**
   * Creates a standardized success response
   */
  private createSuccessResponse(data: any) {
    return {
      content: [
        {
          type: "text",
          // Attempt to stringify, handle potential circular references safely
          text: JSON.stringify(data, (key, value) => {
                if (typeof value === 'object' && value !== null) {
                  // Basic circular reference check placeholder - might need a more robust solution
                  // if complex objects are returned that Cheerio might create.
                  // For simple data structures, this might be okay.
                }
                return value;
              }, 2)
        },
      ],
    };
  }


  /**
   * Handle the get_flux_component_details tool request
   */
  private async handleGetComponentDetails(args: any) {
    const componentName = this.validateComponentName(args);

    try {
      // Check cache first
      if (this.componentCache.has(componentName)) {
        const cachedData = this.componentCache.get(componentName);
         console.error(`Cache hit for ${componentName}`);
        return this.createSuccessResponse(cachedData);
      }
       console.error(`Cache miss for ${componentName}, fetching...`);

      // Fetch component details
      const componentInfo = await this.fetchComponentDetails(componentName);

      // Save to cache
      this.componentCache.set(componentName, componentInfo);
       console.error(`Cached details for ${componentName}`);

      return this.createSuccessResponse(componentInfo);
    } catch (error) {
       console.error(`Error fetching details for ${componentName}:`, error);
      // Ensure handleAxiosError is called correctly or rethrow McpError
      if (error instanceof McpError) {
        throw error;
      }
      this.handleAxiosError(error, `fetching details for component "${componentName}"`);
    }
  }

  /**
   * Fetches component details from the Flux UI documentation
   */
  private async fetchComponentDetails(componentName: string): Promise<ComponentInfo> {
    const componentUrl = `${this.FLUX_DOCS_URL}/components/${componentName}`;
     console.error(`Fetching URL: ${componentUrl}`);
    const response = await this.axiosInstance.get(componentUrl);
    const $ = cheerio.load(response.data);
     console.error(`Successfully loaded HTML for ${componentName}`);

    // Extract component information
    const title = $("h1").first().text().trim();
    const description = this.extractDescription($);
    const examples = this.extractExamples($); // Extract examples first to find import statement
    const importStatement = this.findImportStatement(examples);
    const props = this.extractProps($);

    console.error(`Extracted for ${componentName}: Title=${title}, Desc=${description.substring(0,50)}..., Import=${importStatement}, Props=${Object.keys(props).length}, Examples=${examples.length}`);

    return {
      name: title || componentName, // Use extracted title if available
      description,
      url: componentUrl,
      importStatement,
      props: Object.keys(props).length > 0 ? props : undefined,
      examples, // Include examples in details as well
    };
  }

  /**
   * Extracts component description from the page
   */
  private extractDescription($: cheerio.CheerioAPI): string {
     // Find the first <p> tag that is a sibling of the first <h1>
    const descriptionElement = $("h1").first().next("p");
    return descriptionElement.text().trim();
  }

   /**
   * Extracts usage examples and code snippets from the page
   */
  private extractExamples($: cheerio.CheerioAPI): ComponentExample[] {
    const examples: ComponentExample[] = [];
    // Look for sections containing code examples. Flux UI seems to use blocks
    // with a 'Code' tab or similar structure.
    // This selector might need adjustment based on the actual structure.
    // Let's try finding 'pre' elements and their preceding headings.
    $("pre").each((_, element) => {
        const codeBlock = $(element);
        const code = codeBlock.text().trim();

        if (code) {
            let title = "Code Example";
            let description : string | undefined = undefined;

            // Try to find the nearest preceding heading (h2, h3)
            let potentialTitleElement = codeBlock.closest('div[class*="relative"]').prev('h2, h3'); // Adjust selector based on actual structure
            if (!potentialTitleElement.length) {
               potentialTitleElement = codeBlock.parent().prev('h2, h3'); // Try another common structure
            }
             if (!potentialTitleElement.length) {
               potentialTitleElement = codeBlock.prev('h2, h3'); // Simplest case
            }


            if (potentialTitleElement.length) {
                title = potentialTitleElement.text().trim();
                description = `Example for ${title}`;
            } else {
                 // Fallback: Try to find a title in the code block structure if tabs are used
                 const tabButton = codeBlock.closest('[role="tabpanel"]')?.attr('aria-labelledby');
                 if (tabButton) {
                    const titleElement = $(`#${tabButton}`);
                    if(titleElement.length && titleElement.text().trim().toLowerCase() === 'code') {
                        // Find the heading associated with this example block
                        let heading = $(`#${tabButton}`).closest('div').prev('h2, h3'); // Adjust based on DOM
                        if(heading.length) title = heading.text().trim();
                    }
                 }
            }


            examples.push({ title, code, description });
        }
    });

    // Deduplicate examples based on code content if necessary (simple check)
    const uniqueExamples = Array.from(new Map(examples.map(e => [e.code, e])).values());

     console.error(`Found ${uniqueExamples.length} examples.`);
    return uniqueExamples;
  }

   /**
    * Finds the import statement within the extracted examples
    */
   private findImportStatement(examples: ComponentExample[]): string | undefined {
     for (const example of examples) {
       const match = example.code.match(/import\s+{.*}\s+from\s+['"]@fluxui\/core['"]\;?/);
       if (match) {
         return match[0];
       }
     }
     // Fallback search in case it's structured differently
      for (const example of examples) {
       const match = example.code.match(/import\s+.*\s+from\s+['"]@fluxui\/.*['"]\;?/);
       if (match) {
         return match[0];
       }
     }
     console.error("Import statement not found in examples.");
     return undefined;
   }

  /**
   * Extracts component props from the API Reference section
   */
  private extractProps($: cheerio.CheerioAPI): Record<string, ComponentProp[]> {
     const allProps: Record<string, ComponentProp[]> = {};
     console.error("Looking for API Reference section...");

     // Find the "API Reference" heading
     const apiSection = $("h2").filter((_, el) => $(el).text().trim() === "API Reference");

     if (!apiSection.length) {
         console.error("API Reference section (h2) not found.");
         return allProps;
     }
     console.error("API Reference section found.");


     // Find all component headings (h3) and tables following the API Reference h2
     // This assumes structure: h2 -> h3 (Component Name) -> table (Props)
     apiSection.nextAll('h3').each((_, h3) => {
         const componentNameElement = $(h3);
         const componentName = componentNameElement.text().trim();
          console.error(`Processing component: ${componentName}`);

         // Find the next table sibling for this h3
         const tableElement = componentNameElement.next('table').first(); // Or use nextUntil('h3').filter('table')

         if (!tableElement.length) {
             console.error(`Props table not found immediately after h3: ${componentName}`);
              // Try looking within a div sibling if structure is different
              const nextDiv = componentNameElement.next('div');
              const tableInDiv = nextDiv.find('table').first();
              if(!tableInDiv.length){
                console.error(`Props table not found within next div for h3: ${componentName}`);
                return; // continue to next h3
              }
              // Found table within div, proceed with tableInDiv
              console.error(`Props table found within div for: ${componentName}`);
               this.processPropsTable($, tableInDiv, componentName, allProps);

         } else {
             console.error(`Props table found for: ${componentName}`);
             this.processPropsTable($, tableElement, componentName, allProps);
         }

     });


     return allProps;
   }

   private processPropsTable($: cheerio.CheerioAPI, tableElement: cheerio.Cheerio<Element>, componentName: string, allProps: Record<string, ComponentProp[]>): void {
     const componentProps: ComponentProp[] = [];
     const headers: string[] = [];
     tableElement.find('thead th').each((_, th) => {
       headers.push($(th).text().trim().toLowerCase());
     });

     const propIndex = headers.indexOf('prop');
     const typeIndex = headers.indexOf('type');
     const defaultIndex = headers.indexOf('default');
      // Add descriptionIndex if a description column exists
      // const descriptionIndex = headers.indexOf('description');

     if (propIndex === -1 || typeIndex === -1) {
       console.error(`Could not find 'prop' or 'type' columns in table for ${componentName}`);
       return; // Skip this table
     }

     tableElement.find('tbody tr').each((_, tr) => {
       const cells = $(tr).find('td');
       const propName = cells.eq(propIndex).text().trim();
       const propType = cells.eq(typeIndex).text().trim();
       const propDefault = defaultIndex !== -1 ? cells.eq(defaultIndex).text().trim() : undefined;
       // const propDescription = descriptionIndex !== -1 ? cells.eq(descriptionIndex).text().trim() : undefined;

       if (propName) {
         componentProps.push({
           name: propName,
           type: propType,
           default: propDefault || undefined, // Ensure empty string becomes undefined
           // description: propDescription || undefined,
         });
       }
     });
     if (componentProps.length > 0) {
        allProps[componentName] = componentProps;
        console.error(`Extracted ${componentProps.length} props for ${componentName}`);
     }
   }


  /**
   * Handle the get_component_examples tool request
   */
  private async handleGetComponentExamples(args: any) {
    const componentName = this.validateComponentName(args);

    try {
      // Use cached details if available, otherwise fetch
       let componentInfo: ComponentInfo | undefined = this.componentCache.get(componentName);
        if (!componentInfo) {
             console.error(`Cache miss for examples: ${componentName}, fetching details...`);
            componentInfo = await this.fetchComponentDetails(componentName);
            this.componentCache.set(componentName, componentInfo); // Cache the fetched details
             console.error(`Cached details while fetching examples for ${componentName}`);
        } else {
             console.error(`Cache hit for examples: ${componentName}`);
        }


      const examples = componentInfo?.examples || [];

      if (!examples || examples.length === 0) {
         console.error(`No examples found for ${componentName} even after fetch.`);
        // Optionally, you could try re-fetching just the examples part if details fetch failed previously
        // const freshExamples = await this.fetchComponentExamplesDirectly(componentName);
        // return this.createSuccessResponse(freshExamples);
          return this.createSuccessResponse([]); // Return empty array if none found
      }

      return this.createSuccessResponse(examples);
    } catch (error) {
       console.error(`Error fetching examples for ${componentName}:`, error);
      if (error instanceof McpError) {
          throw error;
      }
      // Pass specific context to error handler
      this.handleAxiosError(error, `fetching examples for component "${componentName}"`);
    }
  }


  // Optional: Direct fetch for examples if needed as fallback or separate logic
  // private async fetchComponentExamplesDirectly(componentName: string): Promise<ComponentExample[]> {
  //     const componentUrl = `${this.FLUX_DOCS_URL}/components/${componentName}`;
  //     const response = await this.axiosInstance.get(componentUrl);
  //     const $ = cheerio.load(response.data);
  //     return this.extractExamples($);
  // }


  /**
   * Handle the search_components tool request
   */
  private async handleSearchComponents(args: any) {
    const query = this.validateSearchQuery(args);

    try {
      // Ensure components list is loaded
      await this.ensureComponentsListLoaded();

      // Filter components matching the search query
       const results = this.searchComponentsByQuery(query);
        console.error(`Search for "${query}" found ${results.length} components.`);

      // Consider fetching full details for search results if needed,
      // but for now, just return name and URL like listComponents.
      // Or fetch descriptions if not already cached?
       const detailedResults = [];
        for (const component of results) {
             let details = this.componentCache.get(component.name);
             if (!details) {
                 try {
                     // Fetch details on demand for search results if not cached
                      console.error(`Search cache miss for ${component.name}, fetching...`);
                     details = await this.fetchComponentDetails(component.name);
                     this.componentCache.set(component.name, details); // Cache fetched details
                 } catch (fetchError) {
                      console.error(`Failed to fetch details for search result ${component.name}:`, fetchError);
                     // Use basic info if fetch fails
                     details = component; // Use the basic ComponentInfo from the list
                 }
             }
             detailedResults.push({
                 name: details.name,
                 description: details.description,
                 url: details.url,
             });
        }


      return this.createSuccessResponse(detailedResults);
    } catch (error) {
       console.error(`Error during search for "${query}":`, error);
       if (error instanceof McpError) {
           throw error;
       }
      this.handleAxiosError(error, `searching components with query "${query}"`);
    }
  }

  /**
   * Ensures the components list is loaded in cache
   */
  private async ensureComponentsListLoaded(): Promise<void> {
    if (!this.componentsListCache) {
       console.error("Component list cache miss, fetching...");
      await this.handleListComponents(); // This fetches and caches the list
    }

    if (!this.componentsListCache) {
       console.error("Failed to load components list after fetch attempt.");
      throw new McpError(
        ErrorCode.InternalError,
        "Failed to load components list"
      );
    }
     console.error("Component list cache ensured.");
  }

  /**
   * Searches components by query string (name and description)
   */
   private searchComponentsByQuery(query: string): ComponentInfo[] {
     if (!this.componentsListCache) {
       console.error("Attempted searchComponentsByQuery with unloaded cache.");
       return []; // Should have been loaded by ensureComponentsListLoaded
     }

     const lowerCaseQuery = query.toLowerCase();

     // Prioritize components where the name matches exactly or starts with the query
     const nameMatches = this.componentsListCache.filter(component =>
       component.name.toLowerCase() === lowerCaseQuery ||
       component.name.toLowerCase().startsWith(lowerCaseQuery)
     );

     // Then, add components where the description contains the query, avoiding duplicates
     const descriptionMatches = this.componentsListCache.filter(component => {
       // Fetch description if not available in list cache
       // This might require fetching details for all components upfront or on-demand during search
       // For now, we assume description might be pre-fetched or fetched on demand elsewhere
       // Let's refine search to only use name if description isn't readily available
       // Or modify handleListComponents to fetch descriptions initially (slower startup)
       // Sticking to name-only search for now based on list cache content.
       // Revisit if description search is crucial and descriptions are fetched.
       return false; // Temporarily disable description search based on current list cache structure
       // component.description?.toLowerCase().includes(lowerCaseQuery)
      }
     );

     // Combine and return
     // return [...nameMatches, ...descriptionMatches];
     return nameMatches; // Return only name matches for now
   }


  /**
   * Run the server
   */
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Flux UI MCP server running on stdio");
  }
}

// Create and run the server
const server = new FluxUiServer();
server.run().catch((error) => {
  console.error("Server failed to run:", error);
  process.exit(1);
}); 