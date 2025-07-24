import { IterationInstance, ProjectContext } from '../types/project-context.js';
export declare class WorktreeManager {
    private contextDetector;
    private conventionDetector;
    private progressTracker;
    private prContentExtractor;
    private globalConfigPath;
    private contextStoragePath;
    constructor(globalConfigPath?: string);
    /**
     * Initialize collabiteration management in a project
     */
    initializeProject(projectPath: string): Promise<ProjectContext>;
    /**
     * Create a new collabiteration with worktree
     */
    createIteration(name: string, projectPath: string, options?: {
        fromBranch?: string;
        description?: string;
        autoStart?: boolean;
        jiraTicket?: string;
    }): Promise<IterationInstance>;
    /**
     * Start an iteration
     */
    startIteration(name: string, projectPath: string): Promise<void>;
    /**
     * Stop an iteration
     */
    stopIteration(name: string, projectPath: string): Promise<void>;
    /**
     * Share an iteration via PR
     */
    shareIteration(name: string, projectPath: string, options?: {
        title?: string;
        description?: string;
        interactive?: boolean;
        extractContent?: boolean;
    }): Promise<string>;
    /**
     * List all iterations for a project
     */
    listIterations(projectPath: string): IterationInstance[];
    /**
     * Remove an iteration
     */
    removeIteration(name: string, projectPath: string, force?: boolean): Promise<void>;
    private ensureDirectories;
    private createBranch;
    private createWorktree;
    private allocatePorts;
    private allocateDatabase;
    private hashString;
    private buildAdaptiveContext;
    private saveProjectContext;
    private loadProjectContext;
    private saveIterationConfig;
    private loadIterationConfig;
    private runPostCreateHooks;
    private runPreStartHooks;
    private runPreShareHooks;
    private waitForDatabase;
    private generatePRBody;
    /**
     * Build enhanced PR context with extracted content
     */
    private buildEnhancedPRContext;
    /**
     * Generate enhanced PR body with rich content
     */
    private generateEnhancedPRBody;
    /**
     * Find PR template for the project
     */
    private findPRTemplate;
    /**
     * Render PR template with variables
     */
    private renderPRTemplate;
    /**
     * Run quality checks and populate status
     */
    private runQualityChecks;
    private printIterationInfo;
    /**
     * Update progress for an iteration
     */
    updateProgress(name: string, projectPath: string, phaseId: string, taskId?: string, status?: 'pending' | 'in_progress' | 'completed' | 'blocked', notes?: string): Promise<void>;
    /**
     * Get progress report for an iteration
     */
    getProgressReport(name: string, projectPath: string): string;
    /**
     * Update registry with current iteration status
     */
    private updateRegistryStatus;
}
//# sourceMappingURL=worktree-manager.d.ts.map