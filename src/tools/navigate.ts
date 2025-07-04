import { z } from 'zod';
import { AbstractTool } from './base.js';
import { ToolResult } from '../types/index.js';

const NavigateSchema = z.object({
  action: z.enum(['home', 'projects', 'new-project', 'documentation', 'settings']).describe('Navigation action'),
  projectId: z.string().optional().describe('Project ID for project-specific navigation'),
});

type NavigateParams = z.infer<typeof NavigateSchema>;

export class NavigateTool extends AbstractTool {
  constructor(browserManager: any) {
    super(NavigateSchema, browserManager);
  }

  getName(): string {
    return 'arcas_onlineeda_navigate';
  }

  getDescription(): string {
    return 'Navigate to different sections of the OnlineEDA platform';
  }

  protected async execute(params: NavigateParams): Promise<ToolResult> {
    await this.ensureLoggedIn();
    
    const page = this.browserManager.getPage();
    if (!page) {
      return {
        success: false,
        error: 'Browser page not available',
      };
    }

    try {
      switch (params.action) {
        case 'home':
          await page.goto('https://onlineeda.arcas-da.com/dashboard', { waitUntil: 'networkidle2' });
          break;
        
        case 'projects':
          await page.goto('https://onlineeda.arcas-da.com/projects', { waitUntil: 'networkidle2' });
          break;
        
        case 'new-project':
          await page.goto('https://onlineeda.arcas-da.com/projects/new', { waitUntil: 'networkidle2' });
          break;
        
        case 'documentation':
          await page.goto('https://onlineeda.arcas-da.com/docs', { waitUntil: 'networkidle2' });
          break;
        
        case 'settings':
          await page.goto('https://onlineeda.arcas-da.com/settings', { waitUntil: 'networkidle2' });
          break;
      }

      await page.waitForTimeout(1000); // Allow page to stabilize

      return {
        success: true,
        data: {
          action: params.action,
          currentUrl: page.url(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Navigation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}