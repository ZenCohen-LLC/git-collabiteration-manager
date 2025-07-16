"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorktreeManager = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const chalk_1 = __importDefault(require("chalk"));
const context_detector_js_1 = require("./context-detector.js");
class WorktreeManager {
    contextDetector = new context_detector_js_1.ContextDetector();
    globalConfigPath;
    contextStoragePath;
    constructor(globalConfigPath) {
        const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
        this.globalConfigPath = globalConfigPath || (0, path_1.join)(homeDir, '.git-iteration-manager');
        this.contextStoragePath = (0, path_1.join)(this.globalConfigPath, 'contexts');
        this.ensureDirectories();
    }
    /**
     * Initialize iteration management in a project
     */
    async initializeProject(projectPath) {
        console.log(chalk_1.default.blue('🔍 Analyzing project...'));
        const fingerprint = await this.contextDetector.analyzeProject(projectPath);
        console.log(chalk_1.default.blue(`📁 Detected: ${fingerprint.frameworks.join(', ')}`));
        // Try to match against known contexts
        let context = await this.contextDetector.matchKnownContext(fingerprint, this.contextStoragePath);
        if (context) {
            console.log(chalk_1.default.green(`✅ Matched known project: ${chalk_1.default.bold(context.name)}`));
            console.log(chalk_1.default.gray(`   ${context.metadata?.description || 'No description'}`));
            // Update context metadata
            this.saveProjectContext(context);
        }
        else {
            console.log(chalk_1.default.yellow('🔧 Building new project context...'));
            context = await this.buildAdaptiveContext(projectPath, fingerprint);
            this.saveProjectContext(context);
            console.log(chalk_1.default.green(`✅ Created new context: ${chalk_1.default.bold(context.name)}`));
        }
        return context;
    }
    /**
     * Create a new iteration with worktree
     */
    async createIteration(name, projectPath, options = {}) {
        const { fromBranch = 'main', description = '', autoStart = false } = options;
        // Validate name
        if (!/^[a-z0-9-]+$/.test(name)) {
            throw new Error('Name must contain only lowercase letters, numbers, and hyphens');
        }
        // Get or create project context
        const context = await this.initializeProject(projectPath);
        // Check if iteration already exists
        const iterationPath = (0, path_1.join)(projectPath, context.iteration.workspacePath, name);
        if ((0, fs_1.existsSync)(iterationPath)) {
            throw new Error(`Iteration '${name}' already exists`);
        }
        console.log(chalk_1.default.blue(`🌿 Creating iteration: ${chalk_1.default.bold(name)}`));
        // Allocate ports and database schema
        const allocatedServices = this.allocatePorts(context.services, name);
        const dbConfig = this.allocateDatabase(context.database, name);
        // Create branch
        const branchName = this.createBranch(name, fromBranch, projectPath, context);
        // Create worktree
        this.createWorktree(name, branchName, iterationPath, projectPath);
        // Create iteration instance
        const iteration = {
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
        console.log(chalk_1.default.green(`✅ Iteration '${name}' created successfully!`));
        this.printIterationInfo(iteration);
        if (autoStart) {
            await this.startIteration(name, projectPath);
        }
        return iteration;
    }
    /**
     * Start an iteration
     */
    async startIteration(name, projectPath) {
        const iteration = this.loadIterationConfig(name, projectPath);
        if (!iteration) {
            throw new Error(`Iteration '${name}' not found`);
        }
        console.log(chalk_1.default.blue(`🚀 Starting iteration: ${chalk_1.default.bold(name)}`));
        // Change to iteration directory
        const originalCwd = process.cwd();
        process.chdir(iteration.workspacePath);
        try {
            // Run pre-start hooks
            await this.runPreStartHooks(iteration);
            // Start database if configured
            if (iteration.database) {
                console.log(chalk_1.default.blue('📊 Starting database...'));
                (0, child_process_1.execSync)('bun run db:start', { stdio: 'inherit' });
                // Wait for database to be ready
                await this.waitForDatabase(iteration.database);
            }
            // Update iteration status
            iteration.lastStarted = new Date().toISOString();
            iteration.status = 'running';
            this.saveIterationConfig(iteration);
            console.log(chalk_1.default.green(`✅ Iteration '${name}' is ready!`));
            this.printIterationInfo(iteration);
            console.log(chalk_1.default.yellow('\n📝 Run these commands to start development:'));
            console.log(chalk_1.default.yellow(`   cd ${iteration.workspacePath}`));
            console.log(chalk_1.default.yellow('   bun run iteration:start  # Start all services'));
        }
        finally {
            process.chdir(originalCwd);
        }
    }
    /**
     * Stop an iteration
     */
    async stopIteration(name, projectPath) {
        const iteration = this.loadIterationConfig(name, projectPath);
        if (!iteration) {
            throw new Error(`Iteration '${name}' not found`);
        }
        console.log(chalk_1.default.blue(`🛑 Stopping iteration: ${chalk_1.default.bold(name)}`));
        const originalCwd = process.cwd();
        process.chdir(iteration.workspacePath);
        try {
            // Stop services
            try {
                (0, child_process_1.execSync)('bun run iteration:stop', { stdio: 'inherit' });
            }
            catch {
                console.log(chalk_1.default.yellow('⚠️  Some services may still be running'));
            }
            // Update status
            iteration.status = 'stopped';
            this.saveIterationConfig(iteration);
            console.log(chalk_1.default.green(`✅ Iteration '${name}' stopped`));
        }
        finally {
            process.chdir(originalCwd);
        }
    }
    /**
     * Share an iteration via PR
     */
    async shareIteration(name, projectPath, options = {}) {
        const iteration = this.loadIterationConfig(name, projectPath);
        if (!iteration) {
            throw new Error(`Iteration '${name}' not found`);
        }
        console.log(chalk_1.default.blue(`📤 Sharing iteration: ${chalk_1.default.bold(name)}`));
        const originalCwd = process.cwd();
        process.chdir(iteration.workspacePath);
        try {
            // Run pre-share hooks (linting, type checking, etc.)
            await this.runPreShareHooks(iteration);
            // Commit any uncommitted changes
            try {
                (0, child_process_1.execSync)('git add -A', { stdio: 'inherit' });
                const commitMessage = `feat: iteration ${name} ready for review

${options.description || 'Iteration work completed and ready for review.'}

🤖 Generated with Git Iteration Manager

Co-Authored-By: Git Iteration Manager <noreply@brkthru.com>`;
                (0, child_process_1.execSync)(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
            }
            catch {
                console.log(chalk_1.default.yellow('📝 No new changes to commit'));
            }
            // Push branch
            try {
                (0, child_process_1.execSync)(`git push origin ${iteration.branch}`, { stdio: 'inherit' });
                console.log(chalk_1.default.green(`📤 Pushed ${iteration.branch} to origin`));
            }
            catch {
                console.log(chalk_1.default.yellow('⚠️  Could not push to remote (no remote configured?)'));
            }
            // Create PR using GitHub CLI
            const title = options.title || `Iteration: ${name}`;
            const prBody = this.generatePRBody(iteration, options.description);
            try {
                const prOutput = (0, child_process_1.execSync)(`gh pr create --title "${title}" --body "${prBody}" --head ${iteration.branch} --base main`, {
                    encoding: 'utf8'
                });
                const prUrl = prOutput.trim();
                // Save PR URL
                iteration.prUrl = prUrl;
                iteration.status = 'shared';
                this.saveIterationConfig(iteration);
                console.log(chalk_1.default.green('✅ Pull Request created successfully!'));
                console.log(chalk_1.default.blue(`🔗 ${prUrl}`));
                return prUrl;
            }
            catch (error) {
                throw new Error(`Failed to create PR. Make sure GitHub CLI is installed and authenticated: ${error}`);
            }
        }
        finally {
            process.chdir(originalCwd);
        }
    }
    /**
     * List all iterations for a project
     */
    listIterations(projectPath) {
        const context = this.loadProjectContext(projectPath);
        if (!context)
            return [];
        const workspacePath = (0, path_1.join)(projectPath, context.iteration.workspacePath);
        if (!(0, fs_1.existsSync)(workspacePath))
            return [];
        const iterations = [];
        try {
            const entries = require('fs').readdirSync(workspacePath);
            for (const entry of entries) {
                const iterationConfigPath = (0, path_1.join)(workspacePath, entry, '.git-iteration-config.json');
                if ((0, fs_1.existsSync)(iterationConfigPath)) {
                    try {
                        const iteration = JSON.parse((0, fs_1.readFileSync)(iterationConfigPath, 'utf8'));
                        iterations.push(iteration);
                    }
                    catch {
                        // Skip invalid configs
                    }
                }
            }
        }
        catch {
            // Skip if can't read workspace
        }
        return iterations.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    }
    /**
     * Remove an iteration
     */
    async removeIteration(name, projectPath, force = false) {
        const iteration = this.loadIterationConfig(name, projectPath);
        if (!iteration) {
            throw new Error(`Iteration '${name}' not found`);
        }
        if (!force) {
            console.log(chalk_1.default.yellow(`⚠️  This will permanently delete iteration '${name}'`));
            console.log(chalk_1.default.yellow('   Use --force to confirm deletion'));
            return;
        }
        console.log(chalk_1.default.blue(`🗑️  Removing iteration: ${chalk_1.default.bold(name)}`));
        try {
            // Stop services first
            await this.stopIteration(name, projectPath).catch(() => { });
            // Remove worktree
            if ((0, fs_1.existsSync)(iteration.workspacePath)) {
                (0, child_process_1.execSync)(`git worktree remove ${iteration.workspacePath} --force`, {
                    cwd: projectPath,
                    stdio: 'inherit'
                });
            }
            console.log(chalk_1.default.green(`✅ Iteration '${name}' removed successfully`));
            console.log(chalk_1.default.yellow(`\n🌿 Branch '${iteration.branch}' still exists.`));
            console.log(chalk_1.default.yellow(`   To remove: git branch -D ${iteration.branch}`));
        }
        catch (error) {
            throw new Error(`Failed to remove iteration: ${error}`);
        }
    }
    // Private helper methods...
    ensureDirectories() {
        if (!(0, fs_1.existsSync)(this.globalConfigPath)) {
            (0, fs_1.mkdirSync)(this.globalConfigPath, { recursive: true });
        }
        if (!(0, fs_1.existsSync)(this.contextStoragePath)) {
            (0, fs_1.mkdirSync)(this.contextStoragePath, { recursive: true });
        }
    }
    createBranch(name, fromBranch, projectPath, context) {
        const branchName = `${context.iteration.branchPrefix}${name}`;
        const originalCwd = process.cwd();
        process.chdir(projectPath);
        try {
            // Check if branch already exists
            try {
                (0, child_process_1.execSync)(`git show-ref --verify --quiet refs/heads/${branchName}`, { stdio: 'ignore' });
                console.log(chalk_1.default.yellow(`⚠️  Branch ${branchName} already exists`));
                return branchName;
            }
            catch {
                // Branch doesn't exist, create it
                console.log(chalk_1.default.blue(`🌿 Creating branch ${branchName} from ${fromBranch}`));
                (0, child_process_1.execSync)(`git checkout ${fromBranch}`, { stdio: 'inherit' });
                // Try to pull from origin
                try {
                    (0, child_process_1.execSync)(`git pull origin ${fromBranch}`, { stdio: 'ignore' });
                }
                catch {
                    console.log(chalk_1.default.yellow('⚠️  Could not pull from origin'));
                }
                (0, child_process_1.execSync)(`git branch ${branchName}`, { stdio: 'inherit' });
                return branchName;
            }
        }
        finally {
            process.chdir(originalCwd);
        }
    }
    createWorktree(name, branchName, iterationPath, projectPath) {
        console.log(chalk_1.default.blue(`🔨 Creating worktree at ${iterationPath}`));
        const originalCwd = process.cwd();
        process.chdir(projectPath);
        try {
            // Ensure workspace directory exists
            const workspaceDir = require('path').dirname(iterationPath);
            if (!(0, fs_1.existsSync)(workspaceDir)) {
                (0, fs_1.mkdirSync)(workspaceDir, { recursive: true });
            }
            (0, child_process_1.execSync)(`git worktree add ${iterationPath} ${branchName}`, { stdio: 'inherit' });
        }
        finally {
            process.chdir(originalCwd);
        }
    }
    allocatePorts(services, iterationName) {
        const allocated = {};
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
    allocateDatabase(dbConfig, iterationName) {
        if (dbConfig.type === 'none')
            return null;
        const portOffset = this.hashString(iterationName) % 100;
        return {
            ...dbConfig,
            actualPort: dbConfig.basePort + (portOffset * 10),
            schemaName: dbConfig.schemaTemplate.replace('{iteration}', iterationName.replace(/-/g, '_'))
        };
    }
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    async buildAdaptiveContext(projectPath, fingerprint) {
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
    saveProjectContext(context) {
        const contextPath = (0, path_1.join)(this.contextStoragePath, `${context.projectId}.json`);
        (0, fs_1.writeFileSync)(contextPath, JSON.stringify(context, null, 2));
    }
    loadProjectContext(projectPath) {
        // This would match against stored contexts
        // For now, return null
        return null;
    }
    saveIterationConfig(iteration) {
        const configPath = (0, path_1.join)(iteration.workspacePath, '.git-iteration-config.json');
        (0, fs_1.writeFileSync)(configPath, JSON.stringify(iteration, null, 2));
    }
    loadIterationConfig(name, projectPath) {
        // Find iteration by name
        const iterations = this.listIterations(projectPath);
        return iterations.find(iter => iter.name === name) || null;
    }
    async runPostCreateHooks(iteration) {
        const hookName = iteration.projectContext.customHooks?.postCreate;
        if (!hookName)
            return;
        console.log(chalk_1.default.blue(`🪝 Running post-create hook: ${hookName}`));
        // Load and run the hook
        try {
            const hookPath = (0, path_1.join)(__dirname, '../../contexts', iteration.projectContext.projectId, 'hooks', 'post-create.js');
            if ((0, fs_1.existsSync)(hookPath)) {
                const hook = require(hookPath);
                if (typeof hook.setupMediaToolIteration === 'function') {
                    await hook.setupMediaToolIteration(iteration.workspacePath, iteration.name, iteration);
                }
            }
        }
        catch (error) {
            console.warn(chalk_1.default.yellow(`⚠️  Post-create hook failed: ${error}`));
        }
    }
    async runPreStartHooks(iteration) {
        // Implementation for pre-start hooks
    }
    async runPreShareHooks(iteration) {
        const hookName = iteration.projectContext.customHooks?.preShare;
        if (!hookName)
            return;
        console.log(chalk_1.default.blue(`🪝 Running quality checks...`));
        try {
            // Run quality checks
            (0, child_process_1.execSync)('bun run quality:check', { stdio: 'inherit' });
            console.log(chalk_1.default.green('✅ Quality checks passed'));
        }
        catch (error) {
            console.warn(chalk_1.default.yellow(`⚠️  Quality checks failed: ${error}`));
            throw new Error('Quality checks failed. Fix issues before sharing.');
        }
    }
    async waitForDatabase(dbConfig) {
        // Wait for database to be ready
        console.log(chalk_1.default.blue('⏳ Waiting for database to be ready...'));
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    generatePRBody(iteration, description) {
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
    printIterationInfo(iteration) {
        console.log(chalk_1.default.cyan('\n📊 Iteration Info:'));
        console.log(chalk_1.default.cyan(`   Name: ${iteration.name}`));
        console.log(chalk_1.default.cyan(`   Branch: ${iteration.branch}`));
        console.log(chalk_1.default.cyan(`   Path: ${iteration.workspacePath}`));
        if (iteration.services.frontend) {
            console.log(chalk_1.default.cyan(`   Frontend: http://localhost:${iteration.services.frontend.actualPort}`));
        }
        if (iteration.services.backend) {
            console.log(chalk_1.default.cyan(`   Backend: http://localhost:${iteration.services.backend.actualPort}`));
        }
        if (iteration.database) {
            console.log(chalk_1.default.cyan(`   Database: ${iteration.database.schemaName} (port ${iteration.database.actualPort})`));
        }
    }
}
exports.WorktreeManager = WorktreeManager;
//# sourceMappingURL=worktree-manager.js.map