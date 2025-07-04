#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { logger } from './utils/logger.js';
import { BrowserManager } from './utils/browser.js';

// Import tools
import { NavigateTool } from './tools/navigate.js';
import { ProjectTool } from './tools/project.js';
import { UploadFileTool } from './tools/upload-file.js';
import { RunVerificationTool } from './tools/run-verification.js';
import { NaturalLanguageTool } from './tools/natural-language.js';

class ArcasOnlineEDAMCPServer {
  private server: Server;
  private browserManager: BrowserManager;
  private tools: Map<string, any>;
  private resources: Map<string, any>;

  constructor() {
    this.server = new Server(
      {
        name: 'arcas-onlineeda-mcp',
        vendor: 'arcas',
        version: '0.1.0',
        description: 'MCP server for Arcas OnlineEDA platform - web-based EDA tools for formal verification and chip design',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );
    
    this.browserManager = new BrowserManager();
    this.tools = new Map();
    this.resources = new Map();
    this.setupTools();
    this.setupResources();
    this.setupHandlers();
  }

  private setupTools(): void {
    const toolInstances = [
      new NavigateTool(this.browserManager),
      new ProjectTool(this.browserManager),
      new UploadFileTool(this.browserManager),
      new RunVerificationTool(this.browserManager),
      new NaturalLanguageTool(this.browserManager),
    ];

    for (const tool of toolInstances) {
      this.tools.set(tool.getName(), tool);
    }
  }

  private setupResources(): void {
    // Define available resources
    this.resources.set('projects', {
      uri: 'arcas://projects',
      name: 'Arcas OnlineEDA Projects',
      description: 'List of all projects in your Arcas OnlineEDA workspace',
      mimeType: 'application/json',
    });

    this.resources.set('verification-results', {
      uri: 'arcas://verification-results',
      name: 'Verification Results',
      description: 'Latest verification results from all projects',
      mimeType: 'application/json',
    });

    this.resources.set('platform-status', {
      uri: 'arcas://platform-status',
      name: 'Platform Status',
      description: 'Current status of Arcas OnlineEDA platform and services',
      mimeType: 'application/json',
    });

    this.resources.set('documentation', {
      uri: 'arcas://documentation',
      name: 'Arcas OnlineEDA Documentation',
      description: 'Platform documentation and user guides',
      mimeType: 'text/markdown',
    });
  }

  private setupHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = Array.from(this.tools.values()).map(tool => ({
        name: tool.getName(),
        description: tool.getDescription(),
        inputSchema: {
          type: 'object',
          properties: tool.getSchema().shape || {},
        },
      }));

      return { tools };
    });

    // List resources handler
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources = Array.from(this.resources.values());
      return { resources };
    });

    // Read resource handler
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      try {
        let content = '';
        
        switch (uri) {
          case 'arcas://projects':
            // Get list of projects
            const projectTool = this.tools.get('arcas_onlineeda_project');
            const projectsResult = await projectTool.validateAndExecute({ action: 'list' });
            content = JSON.stringify(projectsResult.data, null, 2);
            break;
            
          case 'arcas://verification-results':
            // Get latest verification results
            content = JSON.stringify({
              message: 'Use arcas_onlineeda_run_verification to get results for specific projects',
              tip: 'Results are available after running verification on a project'
            }, null, 2);
            break;
            
          case 'arcas://platform-status':
            // Get platform status
            content = JSON.stringify({
              status: 'online',
              browser: this.browserManager.isLoggedIn() ? 'connected' : 'disconnected',
              timestamp: new Date().toISOString()
            }, null, 2);
            break;
            
          case 'arcas://documentation':
            // Get documentation
            content = `# Arcas OnlineEDA Platform Documentation

## Overview
Arcas OnlineEDA is a web-based EDA platform for formal verification and chip design.

## Features
- Formal Verification
- Equivalence Checking
- Power Analysis
- Security Verification
- FPGA Design Support

## Quick Start
1. Create a project
2. Upload your design files
3. Configure verification settings
4. Run verification
5. Review results

For detailed usage, use the natural language tool with your questions.`;
            break;
            
          default:
            throw new Error(`Unknown resource: ${uri}`);
        }
        
        return {
          contents: [
            {
              uri,
              mimeType: this.resources.get(uri.split('://')[1])?.mimeType || 'text/plain',
              text: content,
            }
          ]
        };
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to read resource: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      const tool = this.tools.get(name);
      if (!tool) {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Tool ${name} not found`
        );
      }

      try {
        const result = await tool.validateAndExecute(args || {});
        
        if (!result.success) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${result.error}`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error(`Error executing tool ${name}:`, error);
        
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    
    logger.info('Starting OnlineEDA MCP server...');
    
    // Initialize browser
    try {
      await this.browserManager.initialize();
      await this.browserManager.navigateToOnlineEDA();
      logger.info('Browser initialized and navigated to OnlineEDA');
    } catch (error) {
      logger.error('Failed to initialize browser:', error);
      logger.warn('Server starting without browser - some features may not work');
    }

    await this.server.connect(transport);
    logger.info('OnlineEDA MCP server started successfully');

    // Handle shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down OnlineEDA MCP server...');
      await this.browserManager.close();
      process.exit(0);
    });
  }
}

// Start server
const server = new ArcasOnlineEDAMCPServer();
server.start().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});