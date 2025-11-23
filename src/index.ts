#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { HTTPServer } from './httpServer';
import { createImageProcessingTool, handleImageProcessing } from './tools/imageTools';
import { ProcessImageRequest } from './types';
import './utils/cleanup'; // Initialize cleanup routines

class ImageCompressorMCPServer {
  private server: Server;
  private httpServer: HTTPServer;

  constructor() {
    this.server = new Server(
      {
        name: 'online-image-compressor-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.httpServer = new HTTPServer(3001);
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [createImageProcessingTool(this.httpServer)],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'process_image': {
          const result = await handleImageProcessing(
            args as unknown as ProcessImageRequest,
            this.httpServer
          );
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });

    // Error handling
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.cleanup();
      process.exit(0);
    });
  }

  private async cleanup(): Promise<void> {
    console.log('Shutting down servers...');
    try {
      await this.httpServer.stop();
    } catch (error) {
      console.error('Error stopping HTTP server:', error);
    }
  }

  async start(): Promise<void> {
    // Start the HTTP server first
    await this.httpServer.start();
    
    // Start the MCP server
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.log('Image Compressor MCP Server started successfully');
  }
}

// Start the server
async function main() {
  try {
    const server = new ImageCompressorMCPServer();
    await server.start();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { ImageCompressorMCPServer };