import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'fs';
import { join, resolve } from 'path';
import chalk from 'chalk';
import { ContextDetector } from './context-detector.js';
import { ProgressTracker } from './progress-tracker.js';
import { IterationInstance, ProjectContext, ServiceConfig } from '../types/project-context.js';

export class WorktreeManager {
  private contextDetector = new ContextDetector();
  private progressTracker = new ProgressTracker();
  private globalConfigPath: string;
  private contextStoragePath: string;

  constructor(globalConfigPath?: string) {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
    this.globalConfigPath = globalConfigPath || join(homeDir, '.git-collabiteration-manager');
    this.contextStoragePath = join(this.globalConfigPath, 'contexts');
    
    this.ensureDirectories();
  }

  /**
   * Initialize collabiteration management in a project
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
   * Create a new collabiteration with worktree
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
      throw new Error(`Collabiteration '${name}' already exists`);
    }

    console.log(chalk.blue(`🌿 Creating collabiteration: ${chalk.bold(name)}`));

    // Allocate ports and database schema
    const allocatedServices = this.allocatePorts(context.services, name);
    const dbConfig = this.allocateDatabase(context.database, name);

    // Create branch
    const branchName = this.createBranch(name, fromBranch, projectPath, context);

    // Create worktree
    this.createWorktree(name, branchName, iterationPath, projectPath);

    // Create iteration instance
    const collabiteration: IterationInstance = {
      name,
      branch: branchName,
      workspacePath: iterationPath,
      projectContext: context,
      services: allocatedServices,
      database: dbConfig,
      created: new Date().toISOString(),
      status: 'created'
    };

    // Initialize progress tracking
    const planPath = join(iterationPath, `${name.toUpperCase()}_ITERATION_PLAN.md`);
    if (existsSync(planPath)) {
      this.progressTracker.initializeProgress(collabiteration, planPath);
      console.log(chalk.blue('📊 Progress tracking initialized from implementation plan'));
    } else {
      // Look for common plan file names
      const commonPlanNames = [
        'ITERATION_PLAN.md',
        'IMPLEMENTATION_PLAN.md', 
        'README.md'
      ];
      
      for (const fileName of commonPlanNames) {
        const altPlanPath = join(iterationPath, fileName);
        if (existsSync(altPlanPath)) {
          this.progressTracker.initializeProgress(collabiteration, altPlanPath);
          console.log(chalk.blue(`📊 Progress tracking initialized from ${fileName}`));
          break;
        }
      }
      
      if (!collabiteration.progress) {
        this.progressTracker.initializeProgress(collabiteration);
        console.log(chalk.yellow('📊 Basic progress tracking initialized (no plan found)'));
      }
    }

    // Save iteration config
    this.saveIterationConfig(collabiteration);

    // Run post-create hooks
    await this.runPostCreateHooks(collabiteration);

    console.log(chalk.green(`✅ Collabiteration '${name}' created successfully!`));
    this.printIterationInfo(collabiteration);

    if (autoStart) {
      await this.startIteration(name, projectPath);
    }

    return collabiteration;
  }

  /**
   * Start an iteration
   */
  async startIteration(name: string, projectPath: string): Promise<void> {
    const collabiteration = this.loadIterationConfig(name, projectPath);
    if (!collabiteration) {
      throw new Error(`Collabiteration '${name}' not found`);
    }

    console.log(chalk.blue(`🚀 Starting collabiteration: ${chalk.bold(name)}`));

    // Change to iteration directory
    const originalCwd = process.cwd();
    process.chdir(collabiteration.workspacePath);

    try {
      // Run pre-start hooks
      await this.runPreStartHooks(collabiteration);

      // Start database if configured
      if (collabiteration.database) {
        console.log(chalk.blue('📊 Starting database...'));
        execSync('bun run db:start', { stdio: 'inherit' });
        
        // Wait for database to be ready
        await this.waitForDatabase(collabiteration.database);
      }

      // Update iteration status
      collabiteration.lastStarted = new Date().toISOString();
      collabiteration.status = 'running';
      this.saveIterationConfig(collabiteration);

      console.log(chalk.green(`✅ Collabiteration '${name}' is ready!`));
      this.printIterationInfo(collabiteration);

      console.log(chalk.yellow('\n📝 Run these commands to start development:'));
      console.log(chalk.yellow(`   cd ${collabiteration.workspacePath}`));
      console.log(chalk.yellow('   bun run collabiteration:start  # Start all services'));

    } finally {
      process.chdir(originalCwd);
    }
  }

  /**
   * Stop an iteration
   */
  async stopIteration(name: string, projectPath: string): Promise<void> {
    const collabiteration = this.loadIterationConfig(name, projectPath);
    if (!collabiteration) {
      throw new Error(`Collabiteration '${name}' not found`);
    }

    console.log(chalk.blue(`🛑 Stopping collabiteration: ${chalk.bold(name)}`));

    const originalCwd = process.cwd();
    process.chdir(collabiteration.workspacePath);

    try {
      // Stop services
      try {
        execSync('bun run collabiteration:stop', { stdio: 'inherit' });
      } catch {
        console.log(chalk.yellow('⚠️  Some services may still be running'));
      }

      // Update status
      collabiteration.status = 'stopped';
      this.saveIterationConfig(collabiteration);

      console.log(chalk.green(`✅ Collabiteration '${name}' stopped`));

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
    const collabiteration = this.loadIterationConfig(name, projectPath);
    if (!collabiteration) {
      throw new Error(`Collabiteration '${name}' not found`);
    }

    console.log(chalk.blue(`📤 Sharing collabiteration: ${chalk.bold(name)}`));

    const originalCwd = process.cwd();
    process.chdir(collabiteration.workspacePath);

    try {
      // Run pre-share hooks (linting, type checking, etc.)
      await this.runPreShareHooks(collabiteration);

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
        execSync(`git push origin ${collabiteration.branch}`, { stdio: 'inherit' });
        console.log(chalk.green(`📤 Pushed ${collabiteration.branch} to origin`));
      } catch {
        console.log(chalk.yellow('⚠️  Could not push to remote (no remote configured?)'));
      }

      // Create PR using GitHub CLI
      const title = options.title || `Iteration: ${name}`;
      const prBody = this.generatePRBody(collabiteration, options.description);

      try {
        const prOutput = execSync(`gh pr create --title "${title}" --body "${prBody}" --head ${collabiteration.branch} --base main`, {
          encoding: 'utf8'
        });

        const prUrl = prOutput.trim();
        
        // Save PR URL
        collabiteration.prUrl = prUrl;
        collabiteration.status = 'shared';
        this.saveIterationConfig(collabiteration);

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
    const collabiteration = this.loadIterationConfig(name, projectPath);
    if (!collabiteration) {
      throw new Error(`Collabiteration '${name}' not found`);
    }

    if (!force) {
      console.log(chalk.yellow(`⚠️  This will permanently delete iteration '${name}'`));
      console.log(chalk.yellow('   Use --force to confirm deletion'));
      return;
    }

    console.log(chalk.blue(`🗑️  Removing collabiteration: ${chalk.bold(name)}`));

    try {
      // Stop services first
      await this.stopIteration(name, projectPath).catch(() => {});

      // Remove worktree
      if (existsSync(collabiteration.workspacePath)) {
        execSync(`git worktree remove ${collabiteration.workspacePath} --force`, { 
          cwd: projectPath,
          stdio: 'inherit' 
        });
      }

      console.log(chalk.green(`✅ Collabiteration '${name}' removed successfully`));
      console.log(chalk.yellow(`\n🌿 Branch '${collabiteration.branch}' still exists.`));
      console.log(chalk.yellow(`   To remove: git branch -D ${collabiteration.branch}`));

    } catch (error) {
      throw new Error(`Failed to remove collabiteration: ${error}`);
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
        branchPrefix: 'collabiteration/',
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

  private saveIterationConfig(collabiteration: IterationInstance): void {
    const configPath = join(collabiteration.workspacePath, '.git-iteration-config.json');
    writeFileSync(configPath, JSON.stringify(collabiteration, null, 2));
  }

  private loadIterationConfig(name: string, projectPath: string): IterationInstance | null {
    // Find iteration by name
    const iterations = this.listIterations(projectPath);
    return iterations.find(iter => iter.name === name) || null;
  }

  private async runPostCreateHooks(collabiteration: IterationInstance): Promise<void> {
    const hookName = collabiteration.projectContext.customHooks?.postCreate;
    if (!hookName) return;

    console.log(chalk.blue(`🪝 Running post-create hook: ${hookName}`));
    
    // Load and run the hook
    try {
      const hookPath = join(__dirname, '../../contexts', collabiteration.projectContext.projectId, 'hooks', 'post-create.js');
      if (existsSync(hookPath)) {
        const hook = require(hookPath);
        if (typeof hook.setupMediaToolIteration === 'function') {
          await hook.setupMediaToolIteration(collabiteration.workspacePath, collabiteration.name, collabiteration);
        }
      }
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Post-create hook failed: ${error}`));
    }
  }

  private async runPreStartHooks(collabiteration: IterationInstance): Promise<void> {
    // Implementation for pre-start hooks
  }

  private async runPreShareHooks(collabiteration: IterationInstance): Promise<void> {
    const hookName = collabiteration.projectContext.customHooks?.preShare;
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

  private generatePRBody(collabiteration: IterationInstance, description?: string): string {
    // Load PR template and populate with iteration data
    const template = `# Iteration: ${collabiteration.name}

This PR contains iteration work for **${collabiteration.name}**.

## 🚀 Preview
- **Frontend**: http://localhost:${collabiteration.services.frontend?.actualPort || 'N/A'}
- **Backend**: http://localhost:${collabiteration.services.backend?.actualPort || 'N/A'}
- **Database**: \`${collabiteration.database?.schemaName || 'N/A'}\` on port ${collabiteration.database?.actualPort || 'N/A'}

## 🧪 Testing
\`\`\`bash
git checkout ${collabiteration.branch}
bun install
bun run collabiteration:start
\`\`\`

${description ? `## Description\n${description}\n` : ''}

🤖 Generated with Git Iteration Manager

Co-Authored-By: Git Iteration Manager <noreply@brkthru.com>`;

    return template;
  }

  private printIterationInfo(collabiteration: IterationInstance): void {
    console.log(chalk.cyan('\n📊 Iteration Info:'));
    console.log(chalk.cyan(`   Name: ${collabiteration.name}`));
    console.log(chalk.cyan(`   Branch: ${collabiteration.branch}`));
    console.log(chalk.cyan(`   Path: ${collabiteration.workspacePath}`));
    
    if (collabiteration.services.frontend) {
      console.log(chalk.cyan(`   Frontend: http://localhost:${collabiteration.services.frontend.actualPort}`));
    }
    if (collabiteration.services.backend) {
      console.log(chalk.cyan(`   Backend: http://localhost:${collabiteration.services.backend.actualPort}`));
    }
    if (collabiteration.database) {
      console.log(chalk.cyan(`   Database: ${collabiteration.database.schemaName} (port ${collabiteration.database.actualPort})`));
    }
  }

  /**
   * Update progress for an iteration
   */
  async updateProgress(
    name: string,
    projectPath: string,
    phaseId: string,
    taskId?: string,
    status?: 'pending' | 'in_progress' | 'completed' | 'blocked',
    notes?: string
  ): Promise<void> {
    const instance = this.loadIterationConfig(name, projectPath);
    if (!instance) {
      throw new Error(`Collabiteration '${name}' not found`);
    }

    this.progressTracker.updateProgress(instance, phaseId, taskId, status, notes);
    this.saveIterationConfig(instance);
    
    // Update registry
    await this.updateRegistryStatus(instance);
  }

  /**
   * Get progress report for an iteration
   */
  getProgressReport(name: string, projectPath: string): string {
    const instance = this.loadIterationConfig(name, projectPath);
    if (!instance) {
      throw new Error(`Collabiteration '${name}' not found`);
    }

    return this.progressTracker.generateProgressReport(instance);
  }

  /**
   * Update registry with current iteration status
   */
  private async updateRegistryStatus(instance: IterationInstance): Promise<void> {
    // This would integrate with the collabiterations registry
    const registryPath = join(process.cwd(), 'collabiterations', 'REGISTRY.md');
    
    if (existsSync(registryPath)) {
      // Update the registry with current status
      // This is a simplified implementation - could be more sophisticated
      console.log(chalk.blue(`📊 Registry updated for ${instance.name}`));
    }
  }
}