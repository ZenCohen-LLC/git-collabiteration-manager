import * as crypto from 'crypto';

/**
 * Port allocation configuration
 */
interface PortAllocation {
  frontend: number;
  backend: number;
  database: number;
}

/**
 * Calculate deterministic ports based on iteration name
 * This ensures consistent port allocation across all commands
 */
export function calculatePorts(iterationName: string): PortAllocation {
  // Create hash of iteration name
  const hash = crypto.createHash('md5').update(iterationName).digest();
  
  // Use first byte to determine offset (0-19) * 10
  // This gives us offsets: 0, 10, 20, 30, ... 190
  const offset = (hash[0] % 20) * 10;
  
  return {
    frontend: 5173 + offset,
    backend: 3001 + offset,
    database: 5432 + offset
  };
}

/**
 * Common template variable replacements
 */
export function replaceTemplateVars(
  template: string, 
  vars: Record<string, string>
): string {
  let result = template;
  
  // Replace all occurrences of {varName} with the value
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`{${key}}`, 'g');
    result = result.replace(regex, value);
  }
  
  return result;
}

/**
 * Environment variables for iteration
 */
export function getIterationEnv(
  ports: PortAllocation, 
  name: string
): Record<string, string> {
  return {
    // Iteration metadata
    ITERATION_NAME: name,
    
    // Port configuration
    FRONTEND_PORT: ports.frontend.toString(),
    BACKEND_PORT: ports.backend.toString(),
    DB_PORT: ports.database.toString(),
    
    // API configuration
    VITE_API_URL: `http://localhost:${ports.backend}/api`,
    VITE_PORT: ports.frontend.toString(),
    PORT: ports.backend.toString(),
    
    // Database configuration
    DB_HOST: 'localhost',
    DB_PORT: ports.database.toString(),
    DB_DATABASE: 'media_tool',
    DATABASE_CREDS: JSON.stringify({
      username: 'media_tool',
      password: 'pass'
    }),
    
    // Auth configuration
    TEST_MODE: 'true',
    API_KEY: 'aaaaa',
    ADMIN_PASSWORD: 'bbbbb',
    
    // Environment
    NODE_ENV: 'development',
    STAGE: 'dev'
  };
}

/**
 * Files and patterns to exclude from PRs
 */
export const ITERATION_EXCLUDE_PATTERNS = [
  // Docker and environment files
  'docker-compose.*.yml',
  '.env',
  '.env.iteration',
  '.env.template',
  '.env.local',
  
  // Iteration-specific scripts
  'scripts/start-iteration.sh',
  'scripts/health-check.sh',
  'scripts/setup-test-data.sql',
  'scripts/setup-test-data.sh',
  
  // Documentation
  'STARTUP.md',
  'ITERATION_PLAN.md',
  'ITERATION_STATUS.md',
  'RESUME_STATUS.md',
  
  // Logs and temporary files
  '*.log',
  'backend.log',
  'frontend.log',
  'snowflake.log',
  
  // Claude Flow
  '.claude-flow/',
  '.claude/',
  
  // Test artifacts
  'playwright-report/',
  'test-results/',
  'coverage/',
  
  // Auth bypass patterns
  'TEST_MODE',
  'test@mail.com'
];

/**
 * Check if a file should be excluded from PR
 */
export function shouldExcludeFromPR(filePath: string): boolean {
  return ITERATION_EXCLUDE_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      // Handle wildcard patterns
      const regex = pattern.replace('*', '.*');
      return new RegExp(regex).test(filePath);
    }
    
    // Exact match or path ends with pattern
    return filePath === pattern || 
           filePath.endsWith(`/${pattern}`) ||
           filePath.includes(`/${pattern}/`);
  });
}

/**
 * Standard test user configuration
 */
export const TEST_USER = {
  email: 'test@mail.com',
  name: 'Test User',
  zohoUserId: 'test-zoho-id'
};

/**
 * Standard campaign stages for test data
 */
export const CAMPAIGN_STAGES = [
  'Proposal Development',
  'Avails/Plan Development',
  'Client Review/Approval',
  'Executing Buy',
  'Optimizations',
  'Campaign Ended',
  'Reporting',
  'Campaign is Live'
];

/**
 * Line item types for test data
 */
export const LINE_ITEM_TYPES = [
  { type: 'standard', name: 'Standard Display', impressions: 1000000, cost: 5.00 },
  { type: 'standard', name: 'Premium Video', impressions: 500000, cost: 30.00 },
  { type: 'management_fee', name: 'Management Fee', impressions: 0, cost: 2500.00 },
  { type: 'zero_dollar', name: 'Zero Dollar Social', impressions: 300000, cost: 0.00 }
];