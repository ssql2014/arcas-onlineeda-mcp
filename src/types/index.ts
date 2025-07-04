export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface OnlineEDAProject {
  id: string;
  name: string;
  type: 'formal' | 'equivalence' | 'power' | 'security' | 'fpga';
  files: string[];
  status: 'created' | 'running' | 'completed' | 'failed';
  results?: any;
}

export interface VerificationResult {
  passed: boolean;
  violations: Array<{
    type: string;
    message: string;
    location?: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  statistics?: {
    totalChecks: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

export interface SessionState {
  browser?: any;
  page?: any;
  isLoggedIn: boolean;
  currentProject?: string;
}