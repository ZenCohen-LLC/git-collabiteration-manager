/**
 * Types for enhanced PR generation and context extraction
 */

export interface PRContext {
  // Basic PR information
  title: string;
  description?: string;
  
  // Extracted content from iteration files
  iterationSummary?: string;
  implementationDetails?: string[];
  testingInstructions?: string[];
  successCriteria?: string[];
  
  // Project management integration
  jiraTickets?: string[];
  figmaLinks?: string[];
  relatedPRs?: string[];
  
  // Code changes summary
  filesChanged?: FileChangeInfo[];
  additions?: number;
  deletions?: number;
  
  // Review metadata
  suggestedReviewers?: string[];
  suggestedLabels?: string[];
  reviewFocusAreas?: string[];
  
  // Progress tracking
  progressStatus?: ProgressSummary;
  completedTasks?: string[];
  remainingTasks?: string[];
  
  // Quality checks
  testsStatus?: TestResults;
  lintingStatus?: LintingResults;
  typeCheckStatus?: TypeCheckResults;
  
  // Template variables
  customVariables?: Record<string, string>;
}

export interface FileChangeInfo {
  path: string;
  changeType: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  language?: string;
}

export interface ProgressSummary {
  totalPhases: number;
  completedPhases: number;
  currentPhase?: string;
  overallProgress: number; // 0-100
  blockers?: string[];
}

export interface TestResults {
  passed: boolean;
  totalTests?: number;
  passedTests?: number;
  failedTests?: number;
  coverage?: number;
  details?: string;
}

export interface LintingResults {
  passed: boolean;
  errors?: number;
  warnings?: number;
  fixableErrors?: number;
  details?: string;
}

export interface TypeCheckResults {
  passed: boolean;
  errors?: number;
  details?: string;
}

export interface PRGenerationOptions {
  // Content extraction options
  extractFromPlan?: boolean;
  extractFromReadme?: boolean;
  extractFromTests?: boolean;
  scanForTickets?: boolean;
  scanForLinks?: boolean;
  
  // Interaction options
  interactive?: boolean;
  editBeforeCreate?: boolean;
  draftPR?: boolean;
  
  // Template options
  templatePath?: string;
  useProjectTemplate?: boolean;
  
  // Validation options
  requireTests?: boolean;
  requireLinting?: boolean;
  requireTypeCheck?: boolean;
  blockOnFailure?: boolean;
}

export interface PRTemplate {
  name: string;
  path: string;
  variables: TemplateVariable[];
  sections: TemplateSection[];
}

export interface TemplateVariable {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
  source?: 'iteration' | 'git' | 'extracted' | 'prompted';
}

export interface TemplateSection {
  name: string;
  title: string;
  required: boolean;
  content?: string;
  source?: 'file' | 'extracted' | 'generated';
  sourceConfig?: {
    filePath?: string;
    pattern?: RegExp;
    extractor?: string;
  };
}

export interface ContentExtractionResult {
  summary?: string;
  testPlan?: string[];
  successCriteria?: string[];
  jiraTickets?: string[];
  figmaLinks?: string[];
  implementation?: string[];
  blockers?: string[];
  notes?: string[];
}

export interface PRCreationResult {
  success: boolean;
  prUrl?: string;
  prNumber?: number;
  error?: string;
  warnings?: string[];
}