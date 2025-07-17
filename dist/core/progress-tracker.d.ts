import { IterationInstance, IterationProgress } from '../types/project-context.js';
export declare class ProgressTracker {
    /**
     * Initialize progress tracking for an iteration
     */
    initializeProgress(instance: IterationInstance, planPath?: string): IterationProgress;
    /**
     * Parse an implementation plan document to extract phases and tasks
     */
    private parseImplementationPlan;
    /**
     * Update progress for a specific phase or task
     */
    updateProgress(instance: IterationInstance, phaseId: string, taskId?: string, status?: 'pending' | 'in_progress' | 'completed' | 'blocked', notes?: string): void;
    /**
     * Recalculate overall progress based on completed tasks
     */
    private recalculateProgress;
    /**
     * Generate a progress report
     */
    generateProgressReport(instance: IterationInstance): string;
    /**
     * Save progress to the registry file
     */
    private saveProgressToRegistry;
    /**
     * Generate status markdown file
     */
    private generateStatusMarkdown;
    private extractEstimatedDays;
    private extractPhaseDescription;
    private extractTaskDescription;
    private extractEstimatedHours;
    private determinePriority;
    private getStatusIcon;
    private getStatusEmoji;
    private getTaskSummary;
    private createProgressBar;
}
//# sourceMappingURL=progress-tracker.d.ts.map