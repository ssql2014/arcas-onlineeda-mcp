import { z } from 'zod';
import { AbstractTool } from './base.js';
import { ToolResult, VerificationResult } from '../types/index.js';

const RunVerificationSchema = z.object({
  projectId: z.string().describe('Project ID to run verification on'),
  verificationType: z.enum(['formal', 'equivalence', 'power', 'security', 'fpga']).describe('Type of verification to run'),
  options: z.object({
    timeout: z.number().optional().describe('Verification timeout in seconds'),
    depth: z.number().optional().describe('Verification depth for formal methods'),
    properties: z.array(z.string()).optional().describe('Specific properties to verify'),
  }).optional(),
});

type RunVerificationParams = z.infer<typeof RunVerificationSchema>;

export class RunVerificationTool extends AbstractTool {
  constructor(browserManager: any) {
    super(RunVerificationSchema, browserManager);
  }

  getName(): string {
    return 'arcas_onlineeda_run_verification';
  }

  getDescription(): string {
    return 'Run various verification types on OnlineEDA project';
  }

  protected async execute(params: RunVerificationParams): Promise<ToolResult> {
    await this.ensureLoggedIn();
    
    const page = this.browserManager.getPage();
    if (!page) {
      return {
        success: false,
        error: 'Browser page not available',
      };
    }

    try {
      // Navigate to project verification page
      await page.goto(`https://onlineeda.arcas-da.com/projects/${params.projectId}/verify`, { 
        waitUntil: 'networkidle2' 
      });
      
      // Select verification type
      await page.select('select[name="verificationType"], #verificationType', params.verificationType);
      
      // Configure options if provided
      if (params.options) {
        if (params.options.timeout) {
          await page.type('input[name="timeout"], #timeout', params.options.timeout.toString());
        }
        if (params.options.depth) {
          await page.type('input[name="depth"], #depth', params.options.depth.toString());
        }
      }
      
      // Start verification
      await Promise.all([
        page.click('button.run-verification, button[type="submit"]'),
        page.waitForSelector('.verification-running, .progress-indicator', { timeout: 5000 }),
      ]);
      
      // Wait for verification to complete
      await page.waitForSelector('.verification-complete, .results-ready', { 
        timeout: (params.options?.timeout || 300) * 1000 
      });
      
      // Extract results
      const results = await this.extractVerificationResults(page);
      
      return {
        success: true,
        data: {
          projectId: params.projectId,
          verificationType: params.verificationType,
          results,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private async extractVerificationResults(page: any): Promise<VerificationResult> {
    const results = await page.evaluate(() => {
      // Extract verification results from page (selectors need adjustment)
      const passed = document.querySelector('.verification-passed, .status-passed') !== null;
      
      const violations = Array.from(document.querySelectorAll('.violation-item, .error-item')).map((el: any) => ({
        type: el.querySelector('.violation-type')?.textContent?.trim() || 'unknown',
        message: el.querySelector('.violation-message')?.textContent?.trim() || '',
        location: el.querySelector('.violation-location')?.textContent?.trim(),
        severity: el.querySelector('.violation-severity')?.textContent?.trim() || 'error',
      }));
      
      const stats = {
        totalChecks: parseInt(document.querySelector('.total-checks')?.textContent || '0'),
        passed: parseInt(document.querySelector('.checks-passed')?.textContent || '0'),
        failed: parseInt(document.querySelector('.checks-failed')?.textContent || '0'),
        warnings: parseInt(document.querySelector('.warnings-count')?.textContent || '0'),
      };
      
      return {
        passed,
        violations,
        statistics: stats,
      };
    });
    
    return results;
  }
}