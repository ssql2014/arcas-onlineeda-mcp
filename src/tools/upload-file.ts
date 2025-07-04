import { z } from 'zod';
import { AbstractTool } from './base.js';
import { ToolResult } from '../types/index.js';
import { promises as fs } from 'fs';
import { resolve } from 'path';

const UploadFileSchema = z.object({
  projectId: z.string().describe('Project ID to upload file to'),
  filePath: z.string().describe('Local file path to upload'),
  fileType: z.enum(['verilog', 'systemverilog', 'vhdl', 'constraints', 'other']).optional().describe('File type'),
});

type UploadFileParams = z.infer<typeof UploadFileSchema>;

export class UploadFileTool extends AbstractTool {
  constructor(browserManager: any) {
    super(UploadFileSchema, browserManager);
  }

  getName(): string {
    return 'arcas_onlineeda_upload_file';
  }

  getDescription(): string {
    return 'Upload design files to OnlineEDA project';
  }

  protected async execute(params: UploadFileParams): Promise<ToolResult> {
    await this.ensureLoggedIn();
    
    const page = this.browserManager.getPage();
    if (!page) {
      return {
        success: false,
        error: 'Browser page not available',
      };
    }

    try {
      // Verify file exists
      const absolutePath = resolve(params.filePath);
      await fs.access(absolutePath);
      
      // Navigate to project files page
      await page.goto(`https://onlineeda.arcas-da.com/projects/${params.projectId}/files`, { 
        waitUntil: 'networkidle2' 
      });
      
      // Find file input element
      const fileInput = await page.$('input[type="file"]');
      if (!fileInput) {
        return {
          success: false,
          error: 'File upload input not found on page',
        };
      }
      
      // Upload file
      await fileInput.uploadFile(absolutePath);
      
      // Wait for upload to complete (adjust based on actual UI feedback)
      await page.waitForSelector('.upload-success, .file-uploaded', { timeout: 30000 });
      
      return {
        success: true,
        data: {
          projectId: params.projectId,
          fileName: absolutePath.split('/').pop(),
          filePath: params.filePath,
          message: 'File uploaded successfully',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}