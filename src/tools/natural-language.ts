import { z } from 'zod';
import { AbstractTool } from './base.js';
import { ToolResult } from '../types/index.js';

const NaturalLanguageSchema = z.object({
  query: z.string().describe('Natural language query about Arcas OnlineEDA operations'),
  context: z.object({
    currentProject: z.string().optional().describe('Current project ID'),
    previousResults: z.any().optional().describe('Previous operation results'),
  }).optional(),
});

type NaturalLanguageParams = z.infer<typeof NaturalLanguageSchema>;

interface Example {
  query: string;
  interpretation: string;
  tool: string;
  params: any;
}

export class NaturalLanguageTool extends AbstractTool {
  private examples: Example[] = [
    // Project creation examples
    {
      query: "I want to create a new formal verification project for my CPU design",
      interpretation: "Create formal verification project",
      tool: "arcas_onlineeda_project",
      params: { action: "create", projectType: "formal", projectName: "cpu_formal_verification" }
    },
    {
      query: "Let's start a power analysis project for the GPU controller",
      interpretation: "Create power analysis project",
      tool: "arcas_onlineeda_project",
      params: { action: "create", projectType: "power", projectName: "gpu_controller_power" }
    },
    {
      query: "Set up equivalence checking between RTL and gate-level netlist",
      interpretation: "Create equivalence checking project",
      tool: "arcas_onlineeda_project",
      params: { action: "create", projectType: "equivalence", projectName: "rtl_gate_equivalence" }
    },
    
    // Verification examples
    {
      query: "Check if my RISC-V core meets all safety properties",
      interpretation: "Run formal verification with safety properties",
      tool: "arcas_onlineeda_run_verification",
      params: { verificationType: "formal", options: { properties: ["safety"], depth: 20 } }
    },
    {
      query: "Verify that the optimized design is functionally equivalent to the original",
      interpretation: "Run equivalence verification",
      tool: "arcas_onlineeda_run_verification",
      params: { verificationType: "equivalence" }
    },
    {
      query: "Analyze power consumption during different operating modes",
      interpretation: "Run power analysis verification",
      tool: "arcas_onlineeda_run_verification",
      params: { verificationType: "power", options: { timeout: 600 } }
    },
    {
      query: "Find security vulnerabilities in my crypto module",
      interpretation: "Run security verification",
      tool: "arcas_onlineeda_run_verification",
      params: { verificationType: "security", options: { properties: ["information_leakage", "timing_attacks"] } }
    },
    
    // File operations examples
    {
      query: "Upload my Verilog files for the memory controller",
      interpretation: "Upload Verilog design files",
      tool: "arcas_onlineeda_upload_file",
      params: { fileType: "verilog" }
    },
    {
      query: "Add the SystemVerilog testbench to the project",
      interpretation: "Upload SystemVerilog testbench",
      tool: "arcas_onlineeda_upload_file",
      params: { fileType: "systemverilog" }
    },
    {
      query: "Import SDC timing constraints",
      interpretation: "Upload constraint files",
      tool: "arcas_onlineeda_upload_file",
      params: { fileType: "constraints" }
    },
    
    // Navigation examples
    {
      query: "Show me all my verification projects",
      interpretation: "Navigate to projects list",
      tool: "arcas_onlineeda_navigate",
      params: { action: "projects" }
    },
    {
      query: "Go to the documentation",
      interpretation: "Navigate to documentation",
      tool: "arcas_onlineeda_navigate",
      params: { action: "documentation" }
    },
    
    // Complex workflow examples
    {
      query: "I need to verify my AES encryption module meets FIPS standards",
      interpretation: "Security verification workflow for cryptographic module",
      tool: "workflow",
      params: {
        steps: [
          { tool: "arcas_onlineeda_project", params: { action: "create", projectType: "security", projectName: "aes_fips_verification" } },
          { tool: "arcas_onlineeda_upload_file", params: { fileType: "verilog" } },
          { tool: "arcas_onlineeda_run_verification", params: { verificationType: "security", options: { properties: ["fips_compliance"] } } }
        ]
      }
    },
    {
      query: "Compare power consumption before and after optimization",
      interpretation: "Power comparison workflow",
      tool: "workflow", 
      params: {
        steps: [
          { tool: "arcas_onlineeda_project", params: { action: "create", projectType: "power", projectName: "optimization_comparison" } },
          { tool: "arcas_onlineeda_upload_file", params: { fileType: "verilog", note: "Upload both versions" } },
          { tool: "arcas_onlineeda_run_verification", params: { verificationType: "power" } }
        ]
      }
    }
  ];

  constructor(browserManager: any) {
    super(NaturalLanguageSchema, browserManager);
  }

  getName(): string {
    return 'arcas_onlineeda_natural_language';
  }

  getDescription(): string {
    return 'Process natural language queries for Arcas OnlineEDA operations with extensive examples';
  }

  protected async execute(params: NaturalLanguageParams): Promise<ToolResult> {
    const query = params.query.toLowerCase();
    
    try {
      // First check for exact or close matches in examples
      const exactMatch = this.findBestExample(query);
      if (exactMatch) {
        return {
          success: true,
          data: {
            interpretation: exactMatch.interpretation,
            suggestedTool: exactMatch.tool,
            suggestedParams: exactMatch.params,
            matchedExample: exactMatch.query,
            confidence: 'high',
          },
        };
      }

      // Parse intent from natural language with enhanced understanding
      if (this.isProjectCreation(query)) {
        return this.suggestProjectCreation(query);
      }
      
      if (this.isVerification(query)) {
        return this.suggestVerification(query);
      }
      
      if (this.isFileOperation(query)) {
        return this.suggestFileUpload(query);
      }
      
      if (this.isNavigation(query)) {
        return this.suggestNavigation(query);
      }
      
      if (this.isResultsQuery(query)) {
        return this.suggestGetResults(params.context?.currentProject);
      }
      
      if (this.isHelpQuery(query)) {
        return this.provideEnhancedHelp();
      }
      
      // Fallback with examples
      return this.provideFallbackWithExamples(params.query);
    } catch (error) {
      return {
        success: false,
        error: `Natural language processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private findBestExample(query: string): Example | null {
    // Simple similarity check - in production, use proper NLP
    const words = query.split(' ');
    let bestMatch: Example | null = null;
    let bestScore = 0;

    for (const example of this.examples) {
      const exampleWords = example.query.toLowerCase().split(' ');
      const commonWords = words.filter(word => exampleWords.includes(word)).length;
      const score = commonWords / Math.max(words.length, exampleWords.length);
      
      if (score > bestScore && score > 0.5) {
        bestScore = score;
        bestMatch = example;
      }
    }

    return bestMatch;
  }

  private isProjectCreation(query: string): boolean {
    const keywords = ['create', 'new', 'start', 'setup', 'initialize', 'begin'];
    const projectWords = ['project', 'verification', 'analysis'];
    return keywords.some(k => query.includes(k)) && projectWords.some(p => query.includes(p));
  }

  private isVerification(query: string): boolean {
    const keywords = ['verify', 'check', 'analyze', 'test', 'validate', 'run', 'execute'];
    const verificationTypes = ['formal', 'equivalence', 'power', 'security', 'fpga'];
    return keywords.some(k => query.includes(k)) || verificationTypes.some(v => query.includes(v));
  }

  private isFileOperation(query: string): boolean {
    const keywords = ['upload', 'add', 'import', 'load', 'file', 'design'];
    return keywords.some(k => query.includes(k));
  }

  private isNavigation(query: string): boolean {
    const keywords = ['go', 'navigate', 'show', 'view', 'open', 'list'];
    const sections = ['home', 'projects', 'documentation', 'settings'];
    return keywords.some(k => query.includes(k)) || sections.some(s => query.includes(s));
  }

  private isResultsQuery(query: string): boolean {
    const keywords = ['result', 'report', 'output', 'findings', 'status'];
    return keywords.some(k => query.includes(k));
  }

  private isHelpQuery(query: string): boolean {
    const keywords = ['help', 'how', 'what', 'explain', 'guide', 'tutorial'];
    return keywords.some(k => query.includes(k));
  }

  private suggestProjectCreation(query: string): ToolResult {
    const projectTypes = {
      'formal': ['formal', 'property', 'assertion', 'correctness', 'safety'],
      'equivalence': ['equivalence', 'equivalent', 'compare', 'match', 'same'],
      'power': ['power', 'energy', 'consumption', 'optimization', 'low-power'],
      'security': ['security', 'secure', 'vulnerability', 'crypto', 'attack'],
      'fpga': ['fpga', 'synthesis', 'implementation', 'xilinx', 'altera'],
    };
    
    let detectedType = 'formal';
    for (const [type, keywords] of Object.entries(projectTypes)) {
      if (keywords.some(keyword => query.includes(keyword))) {
        detectedType = type;
        break;
      }
    }
    
    return {
      success: true,
      data: {
        interpretation: 'Create a new project',
        suggestedTool: 'arcas_onlineeda_project',
        suggestedParams: {
          action: 'create',
          projectType: detectedType,
          projectName: 'Suggested: Extract from your requirements',
        },
        examples: this.examples.filter(e => e.tool === 'arcas_onlineeda_project' && e.params.action === 'create'),
        nextSteps: [
          'After creating project, upload design files',
          'Configure verification settings',
          'Run verification',
        ],
      },
    };
  }

  private suggestVerification(query: string): ToolResult {
    const verificationTypes = {
      'formal': ['formal', 'property', 'assertion', 'prove', 'theorem'],
      'equivalence': ['equivalence', 'equivalent', 'compare', 'netlist', 'rtl'],
      'power': ['power', 'energy', 'consumption', 'watts', 'dynamic'],
      'security': ['security', 'secure', 'vulnerability', 'attack', 'leak'],
      'fpga': ['fpga', 'synthesis', 'implementation', 'timing', 'resource'],
    };
    
    let detectedType = 'formal';
    for (const [type, keywords] of Object.entries(verificationTypes)) {
      if (keywords.some(keyword => query.includes(keyword))) {
        detectedType = type;
        break;
      }
    }
    
    return {
      success: true,
      data: {
        interpretation: 'Run verification',
        suggestedTool: 'arcas_onlineeda_run_verification',
        suggestedParams: {
          verificationType: detectedType,
          projectId: 'Required: Use current project ID',
        },
        examples: this.examples.filter(e => e.tool === 'arcas_onlineeda_run_verification'),
        tips: [
          'Ensure all design files are uploaded',
          'Check project status before running verification',
          'Review verification options for specific requirements',
        ],
      },
    };
  }

  private suggestFileUpload(query: string): ToolResult {
    const fileTypes = {
      'verilog': ['verilog', '.v', 'rtl'],
      'systemverilog': ['systemverilog', '.sv', 'testbench'],
      'vhdl': ['vhdl', '.vhd'],
      'constraints': ['constraint', 'sdc', 'xdc', 'timing'],
    };
    
    let detectedType = 'verilog';
    for (const [type, keywords] of Object.entries(fileTypes)) {
      if (keywords.some(keyword => query.includes(keyword))) {
        detectedType = type;
        break;
      }
    }
    
    return {
      success: true,
      data: {
        interpretation: 'Upload design files',
        suggestedTool: 'arcas_onlineeda_upload_file',
        suggestedParams: {
          projectId: 'Required: Use current project ID',
          filePath: 'Required: Path to your design file',
          fileType: detectedType,
        },
        examples: this.examples.filter(e => e.tool === 'arcas_onlineeda_upload_file'),
        supportedFormats: [
          'Verilog (.v)',
          'SystemVerilog (.sv)',
          'VHDL (.vhd, .vhdl)',
          'Constraint files (.sdc, .xdc)',
        ],
      },
    };
  }

  private suggestNavigation(query: string): ToolResult {
    const navigationMap = {
      'home': ['home', 'dashboard', 'main'],
      'projects': ['projects', 'list', 'all'],
      'new-project': ['new', 'create'],
      'documentation': ['docs', 'documentation', 'help', 'guide'],
      'settings': ['settings', 'config', 'preferences'],
    };
    
    let detectedAction = 'home';
    for (const [action, keywords] of Object.entries(navigationMap)) {
      if (keywords.some(keyword => query.includes(keyword))) {
        detectedAction = action;
        break;
      }
    }
    
    return {
      success: true,
      data: {
        interpretation: 'Navigate to platform section',
        suggestedTool: 'arcas_onlineeda_navigate',
        suggestedParams: {
          action: detectedAction,
        },
        availableActions: Object.keys(navigationMap),
      },
    };
  }

  private suggestGetResults(projectId?: string): ToolResult {
    return {
      success: true,
      data: {
        interpretation: 'Get verification results',
        suggestedAction: projectId 
          ? `Navigate to project ${projectId} results page`
          : 'First select a project, then navigate to its results',
        suggestedTool: 'arcas_onlineeda_navigate',
        note: 'Results are typically shown after running verification',
        tip: 'You can also use the arcas://verification-results resource',
      },
    };
  }

  private provideEnhancedHelp(): ToolResult {
    return {
      success: true,
      data: {
        interpretation: 'Help requested',
        overview: 'Arcas OnlineEDA is a comprehensive web-based EDA platform',
        availableTools: [
          {
            name: 'arcas_onlineeda_navigate',
            description: 'Navigate platform sections',
            actions: ['home', 'projects', 'new-project', 'documentation', 'settings'],
          },
          {
            name: 'arcas_onlineeda_project',
            description: 'Manage projects',
            actions: ['create', 'open', 'list', 'delete'],
          },
          {
            name: 'arcas_onlineeda_upload_file',
            description: 'Upload design files to projects',
          },
          {
            name: 'arcas_onlineeda_run_verification',
            description: 'Run verification on projects',
            types: ['formal', 'equivalence', 'power', 'security', 'fpga'],
          },
        ],
        exampleQueries: this.examples.slice(0, 5).map(e => e.query),
        workflow: [
          '1. Create or open a project',
          '2. Upload design files',
          '3. Configure verification settings',
          '4. Run verification',
          '5. Review results',
        ],
        resources: [
          'arcas://projects - List all projects',
          'arcas://verification-results - Latest results',
          'arcas://platform-status - Platform status',
          'arcas://documentation - Full documentation',
        ],
      },
    };
  }

  private provideFallbackWithExamples(query: string): ToolResult {
    return {
      success: true,
      data: {
        interpretation: 'Query understood but needs clarification',
        originalQuery: query,
        suggestions: [
          'Try rephrasing your query',
          'Use specific keywords like: create, verify, upload, navigate',
          'Mention the verification type: formal, equivalence, power, security, fpga',
        ],
        exampleQueries: this.examples.slice(0, 10).map(e => ({
          query: e.query,
          action: e.interpretation,
        })),
        availableTools: [
          'arcas_onlineeda_project - Project management',
          'arcas_onlineeda_upload_file - File uploads',
          'arcas_onlineeda_run_verification - Run verifications',
          'arcas_onlineeda_navigate - Platform navigation',
        ],
      },
    };
  }
}