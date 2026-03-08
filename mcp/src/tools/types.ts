export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  annotations?: Record<string, any>;
  handler: (args: any) => Promise<string>;
}
