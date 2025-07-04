import { z } from 'zod';
import { AbstractTool } from './base.js';
import { ToolResult } from '../types/index.js';

const ProjectSchema = z.object({
  action: z.enum(['create', 'open', 'list', 'delete']).describe('Project action'),
  projectName: z.string().optional().describe('Project name'),
  projectType: z.enum(['formal', 'equivalence', 'power', 'security', 'fpga']).optional().describe('Project type'),
  projectId: z.string().optional().describe('Project ID for open/delete actions'),
});

type ProjectParams = z.infer<typeof ProjectSchema>;

export class ProjectTool extends AbstractTool {
  constructor(browserManager: any) {
    super(ProjectSchema, browserManager);
  }

  getName(): string {
    return 'arcas_onlineeda_project';
  }

  getDescription(): string {
    return 'Manage projects in OnlineEDA platform';
  }

  protected async execute(params: ProjectParams): Promise<ToolResult> {
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
        case 'create':
          if (!params.projectName || !params.projectType) {
            return {
              success: false,
              error: 'Project name and type are required for creating a project',
            };
          }
          return await this.createProject(page, params.projectName, params.projectType);
        
        case 'open':
          if (!params.projectId) {
            return {
              success: false,
              error: 'Project ID is required for opening a project',
            };
          }
          return await this.openProject(page, params.projectId);
        
        case 'list':
          return await this.listProjects(page);
        
        case 'delete':
          if (!params.projectId) {
            return {
              success: false,
              error: 'Project ID is required for deleting a project',
            };
          }
          return await this.deleteProject(page, params.projectId);
        
        default:
          return {
            success: false,
            error: 'Unknown action',
          };
      }
    } catch (error) {
      return {
        success: false,
        error: `Project operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private async createProject(page: any, name: string, type: string): Promise<ToolResult> {
    // Navigate to new project page
    await page.goto('https://onlineeda.arcas-da.com/projects/new', { waitUntil: 'networkidle2' });
    
    // Fill in project details (selectors need to be adjusted based on actual UI)
    await page.waitForSelector('input[name="projectName"], #projectName');
    await page.type('input[name="projectName"], #projectName', name);
    
    // Select project type
    await page.select('select[name="projectType"], #projectType', type);
    
    // Submit form
    await Promise.all([
      page.click('button[type="submit"], .create-project-btn'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);
    
    return {
      success: true,
      data: {
        projectName: name,
        projectType: type,
        message: 'Project created successfully',
      },
    };
  }

  private async openProject(page: any, projectId: string): Promise<ToolResult> {
    await page.goto(`https://onlineeda.arcas-da.com/projects/${projectId}`, { waitUntil: 'networkidle2' });
    
    return {
      success: true,
      data: {
        projectId,
        currentUrl: page.url(),
      },
    };
  }

  private async listProjects(page: any): Promise<ToolResult> {
    await page.goto('https://onlineeda.arcas-da.com/projects', { waitUntil: 'networkidle2' });
    
    // Extract project list (selectors need adjustment)
    const projects = await page.evaluate(() => {
      const projectElements = document.querySelectorAll('.project-item, .project-card');
      return Array.from(projectElements).map((el: any) => ({
        id: el.getAttribute('data-project-id') || el.id,
        name: el.querySelector('.project-name')?.textContent?.trim(),
        type: el.querySelector('.project-type')?.textContent?.trim(),
        status: el.querySelector('.project-status')?.textContent?.trim(),
      }));
    });
    
    return {
      success: true,
      data: {
        projects,
        count: projects.length,
      },
    };
  }

  private async deleteProject(page: any, projectId: string): Promise<ToolResult> {
    await page.goto(`https://onlineeda.arcas-da.com/projects/${projectId}/settings`, { waitUntil: 'networkidle2' });
    
    // Click delete button (with confirmation)
    await page.click('.delete-project-btn, button[data-action="delete"]');
    
    // Confirm deletion
    await page.waitForSelector('.confirm-delete, .modal-confirm');
    await page.click('.confirm-delete, button[data-confirm="delete"]');
    
    return {
      success: true,
      data: {
        projectId,
        message: 'Project deleted successfully',
      },
    };
  }
}