import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'fs';
import { join, resolve } from 'path';
import chalk from 'chalk';
import { ContextDetector } from './context-detector.js';
import { IterationInstance, ProjectContext, ServiceConfig } from '../types/project-context.js';

export class WorktreeManager {
  private contextDetector = new ContextDetector();
  private globalConfigPath: string;
  private contextStoragePath: string;

  constructor(globalConfigPath?: string) {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
    this.globalConfigPath = globalConfigPath || join(homeDir, '.git-iteration-manager');
    this.contextStoragePath = join(this.globalConfigPath, 'contexts');
    
    this.ensureDirectories();
  }

  /**
   * Initialize iteration management in a project
   */
  async initializeProject(projectPath: string): Promise<ProjectContext> {
    console.log(chalk.blue('🔍 Analyzing project...'));
    
    const fingerprint = await this.contextDetector.analyzeProject(projectPath);
    console.log(chalk.blue(`📁 Detected: ${fingerprint.frameworks.join(', ')}`));

    // Try to match against known contexts
    let context = await this.contextDetector.matchKnownContext(fingerprint, this.contextStoragePath);
    
    if (context) {
      console.log(chalk.green(`✅ Matched known project: ${chalk.bold(context.name)}`));
      console.log(chalk.gray(`   ${context.metadata?.description || 'No description'}`));
      
      // Update context metadata
      this.saveProjectContext(context);
    } else {
      console.log(chalk.yellow('🔧 Building new project context...'));
      context = await this.buildAdaptiveContext(projectPath, fingerprint);
      this.saveProjectContext(context);
      console.log(chalk.green(`✅ Created new context: ${chalk.bold(context.name)}`));
    }

    return context;
  }

  /**
   * Create a new iteration with worktree
   */
  async createIteration(
    name: string, 
    projectPath: string,
    options: {
      fromBranch?: string;
      description?: string;
      autoStart?: boolean;
    } = {}
  ): Promise<IterationInstance> {
    const { fromBranch = 'main', description = '', autoStart = false } = options;

    // Validate name
    if (!/^[a-z0-9-]+$/.test(name)) {
      throw new Error('Name must contain only lowercase letters, numbers, and hyphens');
    }

    // Get or create project context
    const context = await this.initializeProject(projectPath);
    
    // Check if iteration already exists
    const iterationPath = join(projectPath, context.iteration.workspacePath, name);
    if (existsSync(iterationPath)) {
      throw new Error(`Iteration '${name}' already exists`);
    }

    console.log(chalk.blue(`🌿 Creating iteration: ${chalk.bold(name)}`));

    // Allocate ports and database schema
    const allocatedServices = this.allocatePorts(context.services, name);
    const dbConfig = this.allocateDatabase(context.database, name);

    // Create branch
    const branchName = this.createBranch(name, fromBranch, projectPath, context);

    // Create worktree
    this.createWorktree(name, branchName, iterationPath, projectPath);

    // Create iteration instance
    const iteration: IterationInstance = {
      name,
      branch: branchName,
      workspacePath: iterationPath,
      projectContext: context,
      services: allocatedServices,
      database: dbConfig,
      created: new Date().toISOString(),
      status: 'created'
    };

    // Save iteration config
    this.saveIterationConfig(iteration);

    // Run post-create hooks
    await this.runPostCreateHooks(iteration);

    console.log(chalk.green(`✅ Iteration '${name}' created successfully!`));
    this.printIterationInfo(iteration);

    if (autoStart) {
      await this.startIteration(name, projectPath);
    }

    return iteration;
  }

  /**
   * Start an iteration
   */
  async startIteration(name: string, projectPath: string): Promise<void> {
    const iteration = this.loadIterationConfig(name, projectPath);
    if (!iteration) {
      throw new Error(`Iteration '${name}' not found`);
    }

    console.log(chalk.blue(`🚀 Starting iteration: ${chalk.bold(name)}`));

    // Change to iteration directory
    const originalCwd = process.cwd();
    process.chdir(iteration.workspacePath);

    try {
      // Run pre-start hooks
      await this.runPreStartHooks(iteration);

      // Start database if configured
      if (iteration.database) {
        console.log(chalk.blue('📊 Starting database...'));
        execSync('bun run db:start', { stdio: 'inherit' });
        
        // Wait for database to be ready
        await this.waitForDatabase(iteration.database);
      }

      // Update iteration status
      iteration.lastStarted = new Date().toISOString();
      iteration.status = 'running';
      this.saveIterationConfig(iteration);

      console.log(chalk.green(`✅ Iteration '${name}' is ready!`));
      this.printIterationInfo(iteration);

      console.log(chalk.yellow('\n📝 Run these commands to start development:'));
      console.log(chalk.yellow(`   cd ${iteration.workspacePath}`));
      console.log(chalk.yellow('   bun run iteration:start  # Start all services'));

    } finally {
      process.chdir(originalCwd);
    }
  }

  /**
   * Stop an iteration
   */
  async stopIteration(name: string, projectPath: string): Promise<void> {
    const iteration = this.loadIterationConfig(name, projectPath);
    if (!iteration) {
      throw new Error(`Iteration '${name}' not found`);
    }

    console.log(chalk.blue(`🛑 Stopping iteration: ${chalk.bold(name)}`));

    const originalCwd = process.cwd();
    process.chdir(iteration.workspacePath);

    try {
      // Stop services
      try {
        execSync('bun run iteration:stop', { stdio: 'inherit' });
      } catch {
        console.log(chalk.yellow('⚠️  Some services may still be running'));
      }

      // Update status
      iteration.status = 'stopped';
      this.saveIterationConfig(iteration);

      console.log(chalk.green(`✅ Iteration '${name}' stopped`));

    } finally {
      process.chdir(originalCwd);
    }
  }

  /**
   * Share an iteration via PR
   */
  async shareIteration(
    name: string, 
    projectPath: string,
    options: { title?: string; description?: string } = {}
  ): Promise<string> {
    const iteration = this.loadIterationConfig(name, projectPath);
    if (!iteration) {
      throw new Error(`Iteration '${name}' not found`);
    }

    console.log(chalk.blue(`📤 Sharing iteration: ${chalk.bold(name)}`));

    const originalCwd = process.cwd();
    process.chdir(iteration.workspacePath);

    try {
      // Run pre-share hooks (linting, type checking, etc.)
      await this.runPreShareHooks(iteration);

      // Commit any uncommitted changes
      try {
        execSync('git add -A', { stdio: 'inherit' });
        const commitMessage = `feat: iteration ${name} ready for review

${options.description || 'Iteration work completed and ready for review.'}

🤖 Generated with Git Iteration Manager

Co-Authored-By: Git Iteration Manager <noreply@brkthru.com>`;

        execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
      } catch {
        console.log(chalk.yellow('📝 No new changes to commit'));
      }

      // Push branch
      try {
        execSync(`git push origin ${iteration.branch}`, { stdio: 'inherit' });
        console.log(chalk.green(`📤 Pushed ${iteration.branch} to origin`));
      } catch {
        console.log(chalk.yellow('⚠️  Could not push to remote (no remote configured?)'));
      }

      // Create PR using GitHub CLI
      const title = options.title || `Iteration: ${name}`;
      const prBody = this.generatePRBody(iteration, options.description);

      try {
        const prOutput = execSync(`gh pr create --title "${title}" --body "${prBody}" --head ${iteration.branch} --base main`, {
          encoding: 'utf8'
        });

        const prUrl = prOutput.trim();
        
        // Save PR URL
        iteration.prUrl = prUrl;
        iteration.status = 'shared';
        this.saveIterationConfig(iteration);

        console.log(chalk.green('✅ Pull Request created successfully!'));
        console.log(chalk.blue(`🔗 ${prUrl}`));

        return prUrl;

      } catch (error) {
        throw new Error(`Failed to create PR. Make sure GitHub CLI is installed and authenticated: ${error}`);
      }

    } finally {
      process.chdir(originalCwd);
    }
  }

  /**
   * List all iterations for a project
   */
  listIterations(projectPath: string): IterationInstance[] {
    const context = this.loadProjectContext(projectPath);
    if (!context) return [];

    const workspacePath = join(projectPath, context.iteration.workspacePath);
    if (!existsSync(workspacePath)) return [];

    const iterations: IterationInstance[] = [];
    
    try {
      const entries = require('fs').readdirSync(workspacePath);
      
      for (const entry of entries) {
        const iterationConfigPath = join(workspacePath, entry, '.git-iteration-config.json');
        if (existsSync(iterationConfigPath)) {
          try {
            const iteration = JSON.parse(readFileSync(iterationConfigPath, 'utf8'));
            iterations.push(iteration);
          } catch {
            // Skip invalid configs
          }
        }
      }
    } catch {
      // Skip if can't read workspace
    }

    return iterations.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  }

  /**
   * Remove an iteration
   */
  async removeIteration(name: string, projectPath: string, force: boolean = false): Promise<void> {
    const iteration = this.loadIterationConfig(name, projectPath);
    if (!iteration) {
      throw new Error(`Iteration '${name}' not found`);
    }

    if (!force) {
      console.log(chalk.yellow(`⚠️  This will permanently delete iteration '${name}'`));
      console.log(chalk.yellow('   Use --force to confirm deletion'));
      return;
    }

    console.log(chalk.blue(`🗑️  Removing iteration: ${chalk.bold(name)}`));

    try {
      // Stop services first
      await this.stopIteration(name, projectPath).catch(() => {});

      // Remove worktree
      if (existsSync(iteration.workspacePath)) {
        execSync(`git worktree remove ${iteration.workspacePath} --force`, { 
          cwd: projectPath,
          stdio: 'inherit' 
        });
      }

      console.log(chalk.green(`✅ Iteration '${name}' removed successfully`));
      console.log(chalk.yellow(`\n🌿 Branch '${iteration.branch}' still exists.`));
      console.log(chalk.yellow(`   To remove: git branch -D ${iteration.branch}`));

    } catch (error) {
      throw new Error(`Failed to remove iteration: ${error}`);
    }
  }

  // Private helper methods...

  private ensureDirectories(): void {
    if (!existsSync(this.globalConfigPath)) {
      mkdirSync(this.globalConfigPath, { recursive: true });
    }
    if (!existsSync(this.contextStoragePath)) {
      mkdirSync(this.contextStoragePath, { recursive: true });
    }
  }

  private createBranch(name: string, fromBranch: string, projectPath: string, context: ProjectContext): string {
    const branchName = `${context.iteration.branchPrefix}${name}`;
    
    const originalCwd = process.cwd();
    process.chdir(projectPath);

    try {
      // Check if branch already exists
      try {
        execSync(`git show-ref --verify --quiet refs/heads/${branchName}`, { stdio: 'ignore' });
        console.log(chalk.yellow(`⚠️  Branch ${branchName} already exists`));
        return branchName;
      } catch {
        // Branch doesn't exist, create it
        console.log(chalk.blue(`🌿 Creating branch ${branchName} from ${fromBranch}`));
        
        execSync(`git checkout ${fromBranch}`, { stdio: 'inherit' });
        
        // Try to pull from origin
        try {
          execSync(`git pull origin ${fromBranch}`, { stdio: 'ignore' });
        } catch {
          console.log(chalk.yellow('⚠️  Could not pull from origin'));
        }
        
        execSync(`git branch ${branchName}`, { stdio: 'inherit' });
        return branchName;
      }
    } finally {
      process.chdir(originalCwd);
    }
  }

  private createWorktree(name: string, branchName: string, iterationPath: string, projectPath: string): void {
    console.log(chalk.blue(`🔨 Creating worktree at ${iterationPath}`));
    
    const originalCwd = process.cwd();
    process.chdir(projectPath);

    try {
      // Ensure workspace directory exists
      const workspaceDir = require('path').dirname(iterationPath);
      if (!existsSync(workspaceDir)) {
        mkdirSync(workspaceDir, { recursive: true });
      }

      execSync(`git worktree add ${iterationPath} ${branchName}`, { stdio: 'inherit' });
    } finally {
      process.chdir(originalCwd);
    }
  }

  private allocatePorts(services: Record<string, ServiceConfig>, iterationName: string): Record<string, ServiceConfig & { actualPort: number }> {
    const allocated: Record<string, ServiceConfig & { actualPort: number }> = {};
    
    // Simple port allocation - in production, would check for conflicts
    let portOffset = this.hashString(iterationName) % 100;
    
    for (const [serviceName, config] of Object.entries(services)) {
      allocated[serviceName] = {
        ...config,
        actualPort: config.basePort + (portOffset * 10)
      };
      portOffset++;
    }

    return allocated;
  }

  private allocateDatabase(dbConfig: any, iterationName: string): any {
    if (dbConfig.type === 'none') return null;

    const portOffset = this.hashString(iterationName) % 100;
    
    return {
      ...dbConfig,
      actualPort: dbConfig.basePort + (portOffset * 10),
      schemaName: dbConfig.schemaTemplate.replace('{iteration}', iterationName.replace(/-/g, '_'))
    };
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private async buildAdaptiveContext(projectPath: string, fingerprint: any): Promise<ProjectContext> {
    // This would be implemented with interactive prompts
    // For now, return a basic context
    const projectName = require('path').basename(projectPath);
    
    return {
      projectId: `custom-${projectName}`,
      name: projectName,
      version: '1.0.0',
      fingerprint,
      database: { type: 'none', basePort: 5432, schemaTemplate: '' },
      services: {
        main: {
          type: 'generic',
          basePort: 3000,
          command: 'npm start'
        }
      },
      iteration: {
        workspacePath: '.git-iterations',
        branchPrefix: 'iteration/',
        autoSeeding: false,
        autoInstall: true
      },
      metadata: {
        created: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        usageCount: 1
      }
    };
  }

  private saveProjectContext(context: ProjectContext): void {
    const contextPath = join(this.contextStoragePath, `${context.projectId}.json`);
    writeFileSync(contextPath, JSON.stringify(context, null, 2));
  }

  private loadProjectContext(projectPath: string): ProjectContext | null {
    // This would match against stored contexts
    // For now, return null
    return null;
  }

  private saveIterationConfig(iteration: IterationInstance): void {
    const configPath = join(iteration.workspacePath, '.git-iteration-config.json');
    writeFileSync(configPath, JSON.stringify(iteration, null, 2));
  }

  private loadIterationConfig(name: string, projectPath: string): IterationInstance | null {
    // Find iteration by name
    const iterations = this.listIterations(projectPath);
    return iterations.find(iter => iter.name === name) || null;
  }

  private async runPostCreateHooks(iteration: IterationInstance): Promise<void> {
    const hookName = iteration.projectContext.customHooks?.postCreate;
    if (!hookName) return;

    console.log(chalk.blue(`🪝 Running post-create hook: ${hookName}`));
    
    // Load and run the hook
    try {
      const hookPath = join(__dirname, '../../contexts', iteration.projectContext.projectId, 'hooks', 'post-create.js');
      if (existsSync(hookPath)) {
        const hook = require(hookPath);
        if (typeof hook.setupMediaToolIteration === 'function') {
          await hook.setupMediaToolIteration(iteration.workspacePath, iteration.name, iteration);
        }
      }
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Post-create hook failed: ${error}`));
    }
  }

  private async runPreStartHooks(iteration: IterationInstance): Promise<void> {
    // Implementation for pre-start hooks
  }

  private async runPreShareHooks(iteration: IterationInstance): Promise<void> {
    const hookName = iteration.projectContext.customHooks?.preShare;
    if (!hookName) return;

    console.log(chalk.blue(`🪝 Running quality checks...`));
    
    try {
      // Run quality checks
      execSync('bun run quality:check', { stdio: 'inherit' });
      console.log(chalk.green('✅ Quality checks passed'));
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Quality checks failed: ${error}`));
      throw new Error('Quality checks failed. Fix issues before sharing.');
    }
  }

  private async waitForDatabase(dbConfig: any): Promise<void> {
    // Wait for database to be ready
    console.log(chalk.blue('⏳ Waiting for database to be ready...'));
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  private generatePRBody(iteration: IterationInstance, description?: string): string {
    // Load PR template and populate with iteration data
    const template = `# Iteration: ${iteration.name}

This PR contains iteration work for **${iteration.name}**.

## 🚀 Preview
- **Frontend**: http://localhost:${iteration.services.frontend?.actualPort || 'N/A'}
- **Backend**: http://localhost:${iteration.services.backend?.actualPort || 'N/A'}
- **Database**: \`${iteration.database?.schemaName || 'N/A'}\` on port ${iteration.database?.actualPort || 'N/A'}

## 🧪 Testing
\`\`\`bash
git checkout ${iteration.branch}
bun install
bun run iteration:start
\`\`\`

${description ? `## Description\n${description}\n` : ''}

🤖 Generated with Git Iteration Manager

Co-Authored-By: Git Iteration Manager <noreply@brkthru.com>`;

    return template;
  }

  private printIterationInfo(iteration: IterationInstance): void {
    console.log(chalk.cyan('\n📊 Iteration Info:'));
    console.log(chalk.cyan(`   Name: ${iteration.name}`));
    console.log(chalk.cyan(`   Branch: ${iteration.branch}`));
    console.log(chalk.cyan(`   Path: ${iteration.workspacePath}`));
    
    if (iteration.services.frontend) {
      console.log(chalk.cyan(`   Frontend: http://localhost:${iteration.services.frontend.actualPort}`));
    }
    if (iteration.services.backend) {
      console.log(chalk.cyan(`   Backend: http://localhost:${iteration.services.backend.actualPort}`));
    }
    if (iteration.database) {
      console.log(chalk.cyan(`   Database: ${iteration.database.schemaName} (port ${iteration.database.actualPort})`));
    }
  }
}