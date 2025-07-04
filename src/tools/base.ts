import { z } from 'zod';
import { ToolResult } from '../types/index.js';
import { BrowserManager } from '../utils/browser.js';
import { logger } from '../utils/logger.js';

export abstract class AbstractTool {
  protected schema: z.ZodSchema<any>;
  protected browserManager: BrowserManager;

  constructor(schema: z.ZodSchema<any>, browserManager: BrowserManager) {
    this.schema = schema;
    this.browserManager = browserManager;
  }

  abstract getName(): string;
  abstract getDescription(): string;

  getSchema() {
    return this.schema;
  }

  async validateAndExecute(params: any): Promise<ToolResult> {
    try {
      const validated = this.schema.parse(params);
      logger.info(`Executing tool: ${this.getName()}`, { params: validated });
      
      const result = await this.execute(validated);
      
      logger.info(`Tool ${this.getName()} completed`, { success: result.success });
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error(`Validation error in ${this.getName()}`, error);
        return {
          success: false,
          error: `Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`,
        };
      }
      
      logger.error(`Error executing ${this.getName()}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  protected abstract execute(params: any): Promise<ToolResult>;

  protected async ensureLoggedIn(): Promise<boolean> {
    if (!this.browserManager.isLoggedIn()) {
      logger.info('Not logged in, attempting to login...');
      const loginSuccess = await this.browserManager.login();
      if (!loginSuccess) {
        throw new Error('Failed to login to OnlineEDA. Please check credentials.');
      }
    }
    return true;
  }
}