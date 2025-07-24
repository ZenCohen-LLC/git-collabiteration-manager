import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { execSync } from 'child_process';
import { ContentExtractionResult, FileChangeInfo, PRContext, ProgressSummary } from '../types/pr-context.js';
import { IterationInstance } from '../types/project-context.js';

export class PRContentExtractor {
  /**
   * Extract content from iteration files to enrich PR description
   */
  async extractIterationContent(iteration: IterationInstance): Promise<ContentExtractionResult> {
    const result: ContentExtractionResult = {};
    const iterationPath = iteration.workspacePath;

    // Extract from iteration plan
    const planContent = this.findAndReadPlan(iterationPath, iteration.name);
    if (planContent) {
      result.summary = this.extractSummary(planContent);
      result.successCriteria = this.extractSuccessCriteria(planContent);
      result.implementation = this.extractImplementationDetails(planContent);
    }

    // Extract from testing documentation
    const testingContent = this.findAndReadTestingDocs(iterationPath);
    if (testingContent) {
      result.testPlan = this.extractTestingInstructions(testingContent);
    }

    // Extract tickets and links from all markdown files
    const allMarkdownFiles = this.findMarkdownFiles(iterationPath);
    for (const file of allMarkdownFiles) {
      const content = readFileSync(file, 'utf8');
      const tickets = this.extractJiraTickets(content);
      const figmaLinks = this.extractFigmaLinks(content);
      
      result.jiraTickets = [...(result.jiraTickets || []), ...tickets];
      result.figmaLinks = [...(result.figmaLinks || []), ...figmaLinks];
    }

    // Remove duplicates
    result.jiraTickets = [...new Set(result.jiraTickets)];
    result.figmaLinks = [...new Set(result.figmaLinks)];

    // Extract from commit messages
    const commitTickets = this.extractTicketsFromCommits(iterationPath);
    result.jiraTickets = [...new Set([...(result.jiraTickets || []), ...commitTickets])];

    return result;
  }

  /**
   * Extract file change information using git
   */
  extractFileChanges(iterationPath: string, baseBranch: string = 'main'): FileChangeInfo[] {
    try {
      const diffStat = execSync(`git diff --stat --name-status ${baseBranch}...HEAD`, {
        cwd: iterationPath,
        encoding: 'utf8'
      });

      const changes: FileChangeInfo[] = [];
      const lines = diffStat.trim().split('\n');

      for (const line of lines) {
        const [status, ...pathParts] = line.split('\t');
        const path = pathParts.join('\t');
        
        let changeType: FileChangeInfo['changeType'] = 'modified';
        if (status === 'A') changeType = 'added';
        else if (status === 'D') changeType = 'deleted';
        else if (status.startsWith('R')) changeType = 'renamed';

        // Get detailed stats for the file
        try {
          const stats = execSync(`git diff --numstat ${baseBranch}...HEAD -- "${path}"`, {
            cwd: iterationPath,
            encoding: 'utf8'
          }).trim();

          const [additions, deletions] = stats.split('\t').map(n => parseInt(n) || 0);

          changes.push({
            path,
            changeType,
            additions,
            deletions,
            language: this.detectLanguage(path)
          });
        } catch {
          // Skip files that can't be analyzed
        }
      }

      return changes;
    } catch {
      return [];
    }
  }

  /**
   * Build complete PR context with all extracted information
   */
  async buildPRContext(
    iteration: IterationInstance,
    options: { title?: string; description?: string } = {}
  ): Promise<PRContext> {
    const extractedContent = await this.extractIterationContent(iteration);
    const fileChanges = this.extractFileChanges(iteration.workspacePath);

    const context: PRContext = {
      title: options.title || `Iteration: ${iteration.name}`,
      description: options.description,
      
      // Extracted content
      iterationSummary: extractedContent.summary,
      implementationDetails: extractedContent.implementation,
      testingInstructions: extractedContent.testPlan,
      successCriteria: extractedContent.successCriteria,
      
      // Project management
      jiraTickets: extractedContent.jiraTickets,
      figmaLinks: extractedContent.figmaLinks,
      
      // Code changes
      filesChanged: fileChanges,
      additions: fileChanges.reduce((sum, f) => sum + f.additions, 0),
      deletions: fileChanges.reduce((sum, f) => sum + f.deletions, 0),
      
      // Review focus areas
      reviewFocusAreas: this.determineReviewFocusAreas(fileChanges),
      
      // Progress tracking
      progressStatus: this.extractProgressStatus(iteration),
      
      // Suggested labels based on changes
      suggestedLabels: this.suggestLabels(iteration, fileChanges, extractedContent)
    };

    return context;
  }

  // Private helper methods

  private findAndReadPlan(iterationPath: string, iterationName: string): string | null {
    const planVariants = [
      `${iterationName.toUpperCase()}_ITERATION_PLAN.md`,
      'ITERATION_PLAN.md',
      'IMPLEMENTATION_PLAN.md',
      'README.md'
    ];

    for (const variant of planVariants) {
      const planPath = join(iterationPath, variant);
      if (existsSync(planPath)) {
        return readFileSync(planPath, 'utf8');
      }
    }

    return null;
  }

  private findAndReadTestingDocs(iterationPath: string): string | null {
    const testingFiles = ['TESTING.md', 'TEST_PLAN.md', 'tests/README.md'];
    
    for (const file of testingFiles) {
      const path = join(iterationPath, file);
      if (existsSync(path)) {
        return readFileSync(path, 'utf8');
      }
    }

    return null;
  }

  private findMarkdownFiles(dir: string, files: string[] = []): string[] {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          this.findMarkdownFiles(fullPath, files);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    } catch {
      // Skip directories we can't read
    }

    return files;
  }

  private extractSummary(content: string): string {
    // Look for summary sections
    const summaryPatterns = [
      /## Summary\n([\s\S]*?)(?=\n##|\n###|$)/i,
      /## Overview\n([\s\S]*?)(?=\n##|\n###|$)/i,
      /## Description\n([\s\S]*?)(?=\n##|\n###|$)/i,
      /^#[^#].*\n\n([\s\S]*?)(?=\n##|$)/m // First paragraph after main title
    ];

    for (const pattern of summaryPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim().split('\n').slice(0, 5).join('\n'); // Limit to 5 lines
      }
    }

    // Fallback to first paragraph
    const firstParagraph = content.split('\n\n')[1];
    return firstParagraph ? firstParagraph.trim() : '';
  }

  private extractSuccessCriteria(content: string): string[] {
    const criteria: string[] = [];
    
    // Look for success criteria section
    const successMatch = content.match(/## Success Criteria\n([\s\S]*?)(?=\n##|$)/i);
    if (successMatch) {
      const lines = successMatch[1].trim().split('\n');
      for (const line of lines) {
        if (line.match(/^[-*]\s+/)) {
          criteria.push(line.replace(/^[-*]\s+/, '').trim());
        }
      }
    }

    return criteria;
  }

  private extractImplementationDetails(content: string): string[] {
    const details: string[] = [];
    
    // Look for implementation or changes sections
    const implementationPatterns = [
      /## Implementation\n([\s\S]*?)(?=\n##|$)/i,
      /## Changes\n([\s\S]*?)(?=\n##|$)/i,
      /## What's Changed\n([\s\S]*?)(?=\n##|$)/i
    ];

    for (const pattern of implementationPatterns) {
      const match = content.match(pattern);
      if (match) {
        const lines = match[1].trim().split('\n');
        for (const line of lines) {
          if (line.match(/^[-*]\s+/)) {
            details.push(line.replace(/^[-*]\s+/, '').trim());
          }
        }
        break;
      }
    }

    return details;
  }

  private extractTestingInstructions(content: string): string[] {
    const instructions: string[] = [];
    
    // Extract numbered or bulleted test steps
    const lines = content.split('\n');
    let inTestSection = false;
    
    for (const line of lines) {
      if (line.match(/^#{1,3}\s+(Testing|Test Plan|How to Test)/i)) {
        inTestSection = true;
        continue;
      }
      
      if (inTestSection && line.match(/^#{1,3}\s+/)) {
        break; // End of test section
      }
      
      if (inTestSection && line.match(/^(\d+\.|[-*])\s+/)) {
        instructions.push(line.replace(/^(\d+\.|[-*])\s+/, '').trim());
      }
    }

    return instructions;
  }

  private extractJiraTickets(content: string): string[] {
    const tickets: string[] = [];
    
    // Common Jira ticket patterns
    const patterns = [
      /\b([A-Z]{2,}-\d+)\b/g, // Standard Jira format
      /jira\.[\w.]+\/browse\/([A-Z]{2,}-\d+)/gi, // Jira URLs
      /ticket[:\s]+([A-Z]{2,}-\d+)/gi // Explicit mentions
    ];

    for (const pattern of patterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        tickets.push(match[1]);
      }
    }

    return [...new Set(tickets)];
  }

  private extractFigmaLinks(content: string): string[] {
    const links: string[] = [];
    
    // Figma URL pattern
    const figmaPattern = /https?:\/\/(?:www\.)?figma\.com\/[\w\/?=&-]+/gi;
    const matches = content.matchAll(figmaPattern);
    
    for (const match of matches) {
      links.push(match[0]);
    }

    return [...new Set(links)];
  }

  private extractTicketsFromCommits(iterationPath: string): string[] {
    const tickets: string[] = [];
    
    try {
      const commits = execSync('git log --format=%s main..HEAD', {
        cwd: iterationPath,
        encoding: 'utf8'
      });

      const lines = commits.trim().split('\n');
      for (const line of lines) {
        const matches = line.matchAll(/\b([A-Z]{2,}-\d+)\b/g);
        for (const match of matches) {
          tickets.push(match[1]);
        }
      }
    } catch {
      // Ignore errors
    }

    return tickets;
  }

  private detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      ts: 'TypeScript',
      tsx: 'TypeScript',
      js: 'JavaScript',
      jsx: 'JavaScript',
      py: 'Python',
      go: 'Go',
      rs: 'Rust',
      java: 'Java',
      css: 'CSS',
      scss: 'SCSS',
      html: 'HTML',
      md: 'Markdown',
      json: 'JSON',
      yml: 'YAML',
      yaml: 'YAML'
    };

    return languageMap[ext || ''] || ext || 'Unknown';
  }

  private determineReviewFocusAreas(changes: FileChangeInfo[]): string[] {
    const areas = new Set<string>();

    for (const change of changes) {
      // Database changes
      if (change.path.includes('migration') || change.path.includes('db/')) {
        areas.add('Database schema changes');
      }
      
      // API changes
      if (change.path.includes('api/') || change.path.includes('routes/') || change.path.includes('controllers/')) {
        areas.add('API endpoint changes');
      }
      
      // Frontend components
      if (change.path.includes('components/') || change.path.includes('pages/')) {
        areas.add('UI component changes');
      }
      
      // Configuration
      if (change.path.includes('config') || change.path.endsWith('.json') || change.path.endsWith('.yml')) {
        areas.add('Configuration changes');
      }
      
      // Tests
      if (change.path.includes('test') || change.path.includes('spec')) {
        areas.add('Test coverage');
      }
      
      // Types
      if (change.path.includes('types/') || change.path.includes('interfaces/')) {
        areas.add('Type definitions');
      }
    }

    return Array.from(areas);
  }

  private extractProgressStatus(iteration: IterationInstance): ProgressSummary | undefined {
    if (!iteration.progress) return undefined;

    const totalPhases = iteration.progress.phases.length;
    const completedPhases = iteration.progress.phases.filter(p => p.status === 'completed').length;
    const currentPhase = iteration.progress.phases.find(p => p.status === 'in_progress');
    
    // Calculate overall progress
    let totalTasks = 0;
    let completedTasks = 0;
    
    for (const phase of iteration.progress.phases) {
      if (phase.tasks) {
        totalTasks += phase.tasks.length;
        completedTasks += phase.tasks.filter(t => t.status === 'completed').length;
      }
    }

    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalPhases,
      completedPhases,
      currentPhase: currentPhase?.name,
      overallProgress,
      blockers: iteration.progress.blockers
    };
  }

  private suggestLabels(
    iteration: IterationInstance,
    changes: FileChangeInfo[],
    content: ContentExtractionResult
  ): string[] {
    const labels = new Set<string>();

    // Based on file changes
    if (changes.some(c => c.path.includes('test'))) {
      labels.add('tests');
    }
    if (changes.some(c => c.path.includes('doc'))) {
      labels.add('documentation');
    }
    if (changes.some(c => c.path.includes('migration'))) {
      labels.add('database');
    }
    if (changes.some(c => c.path.includes('.css') || c.path.includes('.scss'))) {
      labels.add('styling');
    }

    // Based on content
    if (content.jiraTickets && content.jiraTickets.some(t => t.includes('BUG'))) {
      labels.add('bug');
    }
    if (iteration.name.includes('feature')) {
      labels.add('enhancement');
    }
    if (iteration.name.includes('fix')) {
      labels.add('bug');
    }
    if (iteration.name.includes('refactor')) {
      labels.add('refactor');
    }

    // Based on size
    const totalChanges = changes.reduce((sum, c) => sum + c.additions + c.deletions, 0);
    if (totalChanges < 100) {
      labels.add('size/small');
    } else if (totalChanges < 500) {
      labels.add('size/medium');
    } else {
      labels.add('size/large');
    }

    return Array.from(labels);
  }
}