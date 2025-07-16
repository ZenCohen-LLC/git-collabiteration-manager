import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';
import { ProjectFingerprint, ProjectContext } from '../types/project-context.js';

export class ContextDetector {
  /**
   * Analyze a project directory and create a fingerprint
   */
  async analyzeProject(projectPath: string): Promise<ProjectFingerprint> {
    const fingerprint: ProjectFingerprint = {
      directories: [],
      frameworks: [],
      customMarkers: [],
      filePatterns: {}
    };

    // Get git remote if available
    try {
      const remote = execSync('git remote get-url origin', { 
        cwd: projectPath, 
        encoding: 'utf8' 
      }).trim();
      fingerprint.gitRemote = remote;
    } catch {
      // No git remote or not a git repo
    }

    // Analyze directory structure
    fingerprint.directories = this.getDirectoryStructure(projectPath);

    // Analyze package.json if it exists
    const packageJsonPath = join(projectPath, 'package.json');
    if (existsSync(packageJsonPath)) {
      try {
        fingerprint.packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      } catch {
        // Invalid package.json
      }
    }

    // Check for docker-compose
    fingerprint.dockerCompose = existsSync(join(projectPath, 'docker-compose.yml')) ||
                                 existsSync(join(projectPath, 'docker-compose.yaml'));

    // Detect frameworks
    fingerprint.frameworks = this.detectFrameworks(projectPath, fingerprint);

    // Find custom markers
    fingerprint.customMarkers = this.findCustomMarkers(projectPath);

    // Analyze file patterns
    fingerprint.filePatterns = this.analyzeFilePatterns(projectPath);

    return fingerprint;
  }

  /**
   * Try to match project against known contexts
   */
  async matchKnownContext(fingerprint: ProjectFingerprint, contextsPath: string): Promise<ProjectContext | null> {
    if (!existsSync(contextsPath)) {
      return null;
    }

    const contextFiles = readdirSync(contextsPath)
      .filter(file => file.endsWith('.json'))
      .filter(file => !file.endsWith('-latest.json')); // Skip latest symlinks

    for (const contextFile of contextFiles) {
      try {
        const contextPath = join(contextsPath, contextFile);
        const context: ProjectContext = JSON.parse(readFileSync(contextPath, 'utf8'));

        if (this.isContextMatch(fingerprint, context)) {
          // Update metadata
          context.metadata = {
            created: context.metadata?.created || new Date().toISOString(),
            lastUsed: new Date().toISOString(),
            usageCount: (context.metadata?.usageCount || 0) + 1,
            description: context.metadata?.description
          };

          return context;
        }
      } catch {
        // Skip invalid context files
      }
    }

    return null;
  }

  /**
   * Check if a fingerprint matches a known context
   */
  private isContextMatch(fingerprint: ProjectFingerprint, context: ProjectContext): boolean {
    const ctxFingerprint = context.fingerprint;

    // Exact git remote match (highest priority)
    if (fingerprint.gitRemote && ctxFingerprint.gitRemote) {
      if (this.matchGitRemote(fingerprint.gitRemote, ctxFingerprint.gitRemote)) {
        return true;
      }
    }

    // Package.json structure match
    if (fingerprint.packageJson && ctxFingerprint.packageJson) {
      if (this.matchPackageJson(fingerprint.packageJson, ctxFingerprint.packageJson)) {
        return true;
      }
    }

    // Custom markers match (for projects like media-tool with CLAUDE.md)
    if (ctxFingerprint.customMarkers && ctxFingerprint.customMarkers.length > 0) {
      const markerMatches = ctxFingerprint.customMarkers.filter(marker => 
        fingerprint.customMarkers.includes(marker)
      ).length;
      
      if (markerMatches >= Math.ceil(ctxFingerprint.customMarkers.length * 0.7)) {
        return true;
      }
    }

    // Directory structure similarity
    if (this.calculateDirectorySimilarity(fingerprint.directories, ctxFingerprint.directories) > 0.8) {
      return true;
    }

    return false;
  }

  /**
   * Get directory structure up to 2 levels deep
   */
  private getDirectoryStructure(projectPath: string): string[] {
    const directories: string[] = [];
    
    try {
      const entries = readdirSync(projectPath);
      
      for (const entry of entries) {
        if (entry.startsWith('.') && entry !== '.github') continue;
        
        const fullPath = join(projectPath, entry);
        if (statSync(fullPath).isDirectory()) {
          directories.push(entry);
          
          // One level deeper
          try {
            const subEntries = readdirSync(fullPath);
            for (const subEntry of subEntries) {
              if (subEntry.startsWith('.')) continue;
              
              const subFullPath = join(fullPath, subEntry);
              if (statSync(subFullPath).isDirectory()) {
                directories.push(`${entry}/${subEntry}`);
              }
            }
          } catch {
            // Skip if can't read subdirectory
          }
        }
      }
    } catch {
      // Skip if can't read project directory
    }

    return directories.sort();
  }

  /**
   * Detect frameworks and technologies
   */
  private detectFrameworks(projectPath: string, fingerprint: ProjectFingerprint): string[] {
    const frameworks: string[] = [];

    // From package.json dependencies
    if (fingerprint.packageJson) {
      const allDeps = {
        ...fingerprint.packageJson.dependencies,
        ...fingerprint.packageJson.devDependencies
      };

      // React
      if (allDeps.react) frameworks.push('react');
      if (allDeps.vite) frameworks.push('vite');
      if (allDeps['@vitejs/plugin-react']) frameworks.push('vite-react');

      // Node.js frameworks
      if (allDeps.express) frameworks.push('express');
      if (allDeps.fastify) frameworks.push('fastify');
      if (allDeps.next) frameworks.push('nextjs');

      // Databases
      if (allDeps['pg-promise'] || allDeps.pg) frameworks.push('postgresql');
      if (allDeps.mysql2 || allDeps.mysql) frameworks.push('mysql');
      if (allDeps.mongodb) frameworks.push('mongodb');

      // Build tools
      if (allDeps.webpack) frameworks.push('webpack');
      if (allDeps.typescript) frameworks.push('typescript');
      if (allDeps.bun) frameworks.push('bun');

      // Testing
      if (allDeps.jest) frameworks.push('jest');
      if (allDeps.vitest) frameworks.push('vitest');
      if (allDeps['@playwright/test']) frameworks.push('playwright');
    }

    // From file existence
    if (fingerprint.dockerCompose) frameworks.push('docker');
    if (existsSync(join(projectPath, 'tsconfig.json'))) frameworks.push('typescript');
    if (existsSync(join(projectPath, 'tailwind.config.js'))) frameworks.push('tailwindcss');
    if (existsSync(join(projectPath, 'next.config.js'))) frameworks.push('nextjs');

    // From directory structure
    if (fingerprint.directories.includes('packages')) frameworks.push('monorepo');
    if (fingerprint.directories.includes('db/migrations')) frameworks.push('database-migrations');

    return [...new Set(frameworks)].sort();
  }

  /**
   * Find custom markers that identify specific projects
   */
  private findCustomMarkers(projectPath: string): string[] {
    const markers: string[] = [];
    
    const markerFiles = [
      'CLAUDE.md',
      'README.md',
      'Justfile',
      '.pre-commit-config.yaml',
      'bunfig.toml',
      'bun.lock'
    ];

    for (const marker of markerFiles) {
      if (existsSync(join(projectPath, marker))) {
        markers.push(marker);
      }
    }

    // Check for specific directory patterns
    const markerDirs = [
      'db/migrations',
      'packages/frontend',
      'packages/backend',
      'packages/shared',
      'terraform',
      'utils/synthetic-data'
    ];

    for (const markerDir of markerDirs) {
      if (existsSync(join(projectPath, markerDir))) {
        markers.push(`dir:${markerDir}`);
      }
    }

    return markers.sort();
  }

  /**
   * Analyze common file patterns
   */
  private analyzeFilePatterns(projectPath: string): Record<string, boolean> {
    const patterns: Record<string, boolean> = {};

    const checkFiles = [
      'package.json',
      'tsconfig.json',
      'docker-compose.yml',
      'Dockerfile',
      '.eslintrc.js',
      '.prettierrc',
      'jest.config.js',
      'playwright.config.ts'
    ];

    for (const file of checkFiles) {
      patterns[file] = existsSync(join(projectPath, file));
    }

    return patterns;
  }

  /**
   * Match git remotes with wildcards
   */
  private matchGitRemote(actual: string, pattern: string): boolean {
    // Convert pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(regexPattern, 'i');
    return regex.test(actual);
  }

  /**
   * Match package.json structure
   */
  private matchPackageJson(actual: any, expected: any): boolean {
    // Check for key indicators
    if (expected.workspaces && actual.workspaces) {
      return JSON.stringify(actual.workspaces) === JSON.stringify(expected.workspaces);
    }

    // Check for specific dependencies
    if (expected.dependencies) {
      const actualDeps = { ...actual.dependencies, ...actual.devDependencies };
      for (const dep of Object.keys(expected.dependencies)) {
        if (!actualDeps[dep]) {
          return false;
        }
      }
      return true;
    }

    return false;
  }

  /**
   * Calculate directory structure similarity
   */
  private calculateDirectorySimilarity(actual: string[], expected: string[]): number {
    if (expected.length === 0) return 0;

    const matches = expected.filter(dir => actual.includes(dir)).length;
    return matches / expected.length;
  }
}