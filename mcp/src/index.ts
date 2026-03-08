#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { loadConfig } from './config.js';
import type { ToolDefinition } from './tools/types.js';

// Import tool registration modules
import { systemTools } from './tools/indexer/system.js';
import { postTools } from './tools/indexer/posts.js';
import { userTools } from './tools/indexer/users.js';
import { notificationTools } from './tools/indexer/notifications.js';
import { hashtagTools } from './tools/indexer/hashtags.js';
import { socialTools } from './tools/kaspa/social.js';
import { walletTools } from './tools/kaspa/wallet.js';

class KMcpServer {
  private server: Server;
  private tools: Map<string, ToolDefinition> = new Map();

  constructor() {
    this.server = new Server(
      { name: 'k-mcp-server', version: '1.0.0' },
      { capabilities: { tools: {} } },
    );

    this.setupErrorHandling();
    this.initializeTools();
    this.setupHandlers();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => console.error('[K-MCP Error]', error);
    process.on('SIGINT', () => process.exit(0));
  }

  private initializeTools(): void {
    console.error('[K-MCP] Loading configuration...');
    const config = loadConfig();
    console.error(`[K-MCP] Network: ${config.network}`);
    console.error(`[K-MCP] Indexer: ${config.apiBaseUrl}`);
    console.error(`[K-MCP] Public key: ${config.publicKey}`);
    console.error(`[K-MCP] Node: ${config.kaspaNodeUrl || '(resolver)'}`);

    // Collect all tool definitions
    const allTools: ToolDefinition[] = [
      ...systemTools(config),
      ...postTools(config),
      ...userTools(config),
      ...notificationTools(config),
      ...hashtagTools(config),
      ...socialTools(config),
      ...walletTools(config),
    ];

    for (const tool of allTools) {
      this.tools.set(tool.name, tool);
    }

    console.error(`[K-MCP] Registered ${this.tools.size} tools`);
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Array.from(this.tools.values()).map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
          annotations: t.annotations,
        })),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const tool = this.tools.get(name);

      if (!tool) {
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }

      try {
        const result = await tool.handler(args || {});
        return {
          content: [{ type: 'text', text: result }],
        };
      } catch (error: any) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[K-MCP] Tool ${name} error:`, message);
        return {
          content: [{ type: 'text', text: `Error: ${message}` }],
          isError: true,
        };
      }
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('[K-MCP] Server running on stdio');
  }
}

const server = new KMcpServer();
server.start().catch((error) => {
  console.error('[K-MCP] Failed to start:', error);
  process.exit(1);
});
