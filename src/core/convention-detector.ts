import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export interface RepoConventions {
  branchNaming?: {
    categories: string[];
    format: string;
    examples: string[];
  };
  commitMessages?: {
    format: string;
    types: string[];
    pattern?: string;
    examples: string[];
  };
}

export class ConventionDetector {
  /**
   * Detect repository conventions from various sources
   */
  async detectConventions(projectPath: string): Promise<RepoConventions> {
    const conventions: RepoConventions = {};

    // Try multiple sources for conventions
    const sources = [
      { file: 'README.md', parser: this.parseReadme },
      { file: 'CONTRIBUTING.md', parser: this.parseReadme },
      { file: '.gitmessage', parser: this.parseGitMessage },
      { file: 'commitlint.config.js', parser: this.parseCommitlint },
      { file: '.czrc', parser: this.parseCommitizen }
    ];

    for (const source of sources) {
      const filePath = join(projectPath, source.file);
      if (existsSync(filePath)) {
        try {
          const content = readFileSync(filePath, 'utf8');
          const detected = source.parser.call(this, content);
          
          // Merge detected conventions
          if (detected.branchNaming && !conventions.branchNaming) {
            conventions.branchNaming = detected.branchNaming;
          }
          if (detected.commitMessages && !conventions.commitMessages) {
            conventions.commitMessages = detected.commitMessages;
          }
        } catch (error) {
          // Continue with next source
        }
      }
    }

    // If no conventions found, return defaults
    if (!conventions.branchNaming) {
      conventions.branchNaming = this.getDefaultBranchConventions();
    }
    if (!conventions.commitMessages) {
      conventions.commitMessages = this.getDefaultCommitConventions();
    }

    return conventions;
  }

  /**
   * Parse README.md for conventions
   */
  private parseReadme(content: string): RepoConventions {
    const conventions: RepoConventions = {};

    // Look for branch naming section
    const branchSection = this.extractSection(content, [
      'Branch Naming',
      'Branching',
      'Branch Convention',
      'Git Branch'
    ]);

    if (branchSection) {
      conventions.branchNaming = this.parseBranchNamingFromText(branchSection);
    }

    // Look for commit message section
    const commitSection = this.extractSection(content, [
      'Commit Message',
      'Commit Convention',
      'Commit Format',
      'Commits'
    ]);

    if (commitSection) {
      conventions.commitMessages = this.parseCommitMessagesFromText(commitSection);
    }

    return conventions;
  }

  /**
   * Extract a section from markdown content
   */
  private extractSection(content: string, headings: string[]): string | null {
    const lines = content.split('\n');
    let inSection = false;
    let sectionContent = '';
    let currentLevel = 0;

    for (const line of lines) {
      // Check if this is a heading
      const headingMatch = line.match(/^(#+)\s+(.+)/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const title = headingMatch[2];

        // Check if this matches our target headings
        if (headings.some(h => title.toLowerCase().includes(h.toLowerCase()))) {
          inSection = true;
          currentLevel = level;
          continue;
        }

        // Check if we've hit a same-level or higher heading (end of section)
        if (inSection && level <= currentLevel) {
          break;
        }
      }

      if (inSection) {
        sectionContent += line + '\n';
      }
    }

    return sectionContent || null;
  }

  /**
   * Parse branch naming conventions from text
   */
  private parseBranchNamingFromText(text: string): RepoConventions['branchNaming'] {
    const branchNaming: RepoConventions['branchNaming'] = {
      categories: [],
      format: '',
      examples: []
    };

    // Look for format patterns like <category>/<reference>/<description>
    const formatMatch = text.match(/[`']?([<\[{]?\w+[>\]}]?\/[<\[{]?\w+[>\]}]?(?:\/[<\[{]?[\w-]+[>\]}]?)?)[`']?/);
    if (formatMatch) {
      branchNaming.format = formatMatch[1];
    }
    
    // Also check for patterns in code blocks
    const codeBlockMatch = text.match(/```[^`]*?([a-z]+\/[a-z-/]+).*?```/);
    if (!branchNaming.format && codeBlockMatch) {
      // Extract pattern from example
      const example = codeBlockMatch[1];
      const parts = example.split('/');
      if (parts.length >= 2) {
        branchNaming.format = parts.map((_, i) => {
          if (i === 0) return '<category>';
          if (i === 1 && parts.length === 3) return '<reference>';
          return '<description>';
        }).join('/');
      }
    }

    // Look for category lists
    const categoryMatch = text.match(/(?:Categories|Types|Prefixes)[:\s]*\n?((?:[-*]\s*\w+\n?)+)/i);
    if (categoryMatch) {
      const categoriesText = categoryMatch[1];
      branchNaming.categories = categoriesText
        .match(/[-*]\s*(\w+)/g)
        ?.map(m => m.replace(/[-*]\s*/, '').trim()) || [];
    }

    // Alternative: look for inline category list
    if (branchNaming.categories.length === 0) {
      const inlineMatch = text.match(/(?:build|ci|docs|feat|fix|perf|refactor|style|test|chore|revert|bump)/gi);
      if (inlineMatch) {
        branchNaming.categories = [...new Set(inlineMatch.map(c => c.toLowerCase()))];
      }
    }

    // Look for examples
    const exampleMatches = text.matchAll(/(?:example|e\.g\.|i\.e\.)[:\s]*[`']?([a-z]+\/[^\s`']+)[`']?/gi);
    for (const match of exampleMatches) {
      branchNaming.examples.push(match[1]);
    }

    return branchNaming;
  }

  /**
   * Parse commit message conventions from text
   */
  private parseCommitMessagesFromText(text: string): RepoConventions['commitMessages'] {
    const commitMessages: RepoConventions['commitMessages'] = {
      format: '',
      types: [],
      pattern: undefined,
      examples: []
    };

    // Look for Conventional Commits or similar format
    const formatMatch = text.match(/[`']?(\w+)(?:\([^)]+\))?[!:]?\s*[:\s][^`'\n]+[`']?/);
    if (formatMatch) {
      commitMessages.format = 'conventional';
    }

    // Look for regex pattern
    const patternMatch = text.match(/(?:pattern|regex|regexp)[:\s]*[`']?(.+?)[`']?(?:\n|$)/i);
    if (patternMatch) {
      commitMessages.pattern = patternMatch[1];
    }

    // Look for types/categories
    const typeMatch = text.match(/(?:Types?|Categories)[:\s]*\n?((?:[-*]\s*\w+\n?)+)/i);
    if (typeMatch) {
      const typesText = typeMatch[1];
      commitMessages.types = typesText
        .match(/[-*]\s*(\w+)/g)
        ?.map(m => m.replace(/[-*]\s*/, '').trim()) || [];
    }

    // Alternative: look for inline type list
    if (commitMessages.types.length === 0) {
      const inlineMatch = text.match(/(?:build|ci|docs|feat|fix|perf|refactor|style|test|chore|revert|bump)/gi);
      if (inlineMatch) {
        commitMessages.types = [...new Set(inlineMatch.map(t => t.toLowerCase()))];
      }
    }

    // Look for examples
    const exampleMatches = text.matchAll(/(?:example|e\.g\.|i\.e\.)[:\s]*\n?```?\n?([^`]+)\n?```?/gi);
    for (const match of exampleMatches) {
      commitMessages.examples.push(match[1].trim());
    }

    return commitMessages;
  }

  /**
   * Parse .gitmessage template
   */
  private parseGitMessage(content: string): RepoConventions {
    const conventions: RepoConventions = {};
    
    // Check if it follows conventional format
    if (content.match(/^(feat|fix|docs|style|refactor|test|chore|build|ci|perf|revert)(\(.+\))?:/m)) {
      conventions.commitMessages = {
        format: 'conventional',
        types: ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'build', 'ci', 'perf', 'revert'],
        examples: [content.trim()]
      };
    }

    return conventions;
  }

  /**
   * Parse commitlint configuration
   */
  private parseCommitlint(content: string): RepoConventions {
    const conventions: RepoConventions = {};

    try {
      // Basic parsing for common commitlint configs
      if (content.includes('@commitlint/config-conventional')) {
        conventions.commitMessages = {
          format: 'conventional',
          types: ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'build', 'ci', 'perf', 'revert'],
          examples: []
        };
      }
    } catch {
      // Ignore parsing errors
    }

    return conventions;
  }

  /**
   * Parse commitizen configuration
   */
  private parseCommitizen(content: string): RepoConventions {
    const conventions: RepoConventions = {};

    try {
      const config = JSON.parse(content);
      if (config.path?.includes('conventional')) {
        conventions.commitMessages = {
          format: 'conventional',
          types: ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'build', 'ci', 'perf', 'revert'],
          examples: []
        };
      }
    } catch {
      // Ignore parsing errors
    }

    return conventions;
  }

  /**
   * Get default branch naming conventions
   */
  private getDefaultBranchConventions(): RepoConventions['branchNaming'] {
    return {
      categories: ['feature', 'fix', 'hotfix', 'release', 'chore'],
      format: '<category>/<description>',
      examples: ['feature/add-login', 'fix/resolve-crash', 'chore/update-deps']
    };
  }

  /**
   * Get default commit message conventions
   */
  private getDefaultCommitConventions(): RepoConventions['commitMessages'] {
    return {
      format: 'conventional',
      types: ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'],
      examples: ['feat: add user authentication', 'fix: resolve memory leak'],
      pattern: '^(feat|fix|docs|style|refactor|test|chore)(\\(.+\\))?:\\s.+'
    };
  }

  /**
   * Format branch name according to conventions
   */
  formatBranchName(iterationName: string, conventions: RepoConventions['branchNaming']): string {
    if (!conventions || !conventions.format) {
      return `iteration/${iterationName}`;
    }

    // Default to 'feat' category for iterations
    let category = 'feat';
    
    // Try to detect category from iteration name
    const nameWords = iterationName.toLowerCase().split('-');
    for (const word of nameWords) {
      if (conventions.categories.includes(word)) {
        category = word;
        break;
      }
    }

    // Apply format
    let branchName = conventions.format;
    branchName = branchName.replace(/[<\[{]?category[>\]}]?/i, category);
    branchName = branchName.replace(/[<\[{]?type[>\]}]?/i, category);
    branchName = branchName.replace(/[<\[{]?reference[>\]}]?/i, '');
    branchName = branchName.replace(/[<\[{]?description[>\]}]?/i, iterationName);
    branchName = branchName.replace(/[<\[{]?name[>\]}]?/i, iterationName);
    
    // Clean up double slashes and leading/trailing slashes
    branchName = branchName.replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
    
    // Remove empty segments
    branchName = branchName.split('/').filter(s => s.length > 0).join('/');

    return branchName;
  }

  /**
   * Format commit message according to conventions
   */
  formatCommitMessage(message: string, type: string, conventions: RepoConventions['commitMessages']): string {
    if (!conventions || conventions.format !== 'conventional') {
      return message;
    }

    // Ensure type is valid
    const validType = conventions.types.includes(type) ? type : 'feat';

    // Extract scope if present in message
    const scopeMatch = message.match(/^\[([^\]]+)\]\s*(.+)/);
    let scope = '';
    let description = message;

    if (scopeMatch) {
      scope = scopeMatch[1];
      description = scopeMatch[2];
    }

    // Format according to conventional commits
    let formatted = validType;
    if (scope) {
      formatted += `(${scope})`;
    }
    formatted += `: ${description}`;

    // Add body if multiline
    const lines = message.split('\n');
    if (lines.length > 1) {
      formatted += '\n\n' + lines.slice(1).join('\n');
    }

    return formatted;
  }
}