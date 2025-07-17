import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { IterationInstance, IterationProgress, ImplementationPhase, ImplementationTask } from '../types/project-context.js';
import chalk from 'chalk';

export class ProgressTracker {
  
  /**
   * Initialize progress tracking for an iteration
   */
  initializeProgress(instance: IterationInstance, planPath?: string): IterationProgress {
    const progress: IterationProgress = {
      currentPhase: undefined,
      overallProgress: 0,
      phases: [],
      lastUpdated: new Date().toISOString(),
      milestones: []
    };

    // If an implementation plan exists, parse it to extract phases
    if (planPath && existsSync(planPath)) {
      progress.phases = this.parseImplementationPlan(planPath);
    }

    instance.progress = progress;
    return progress;
  }

  /**
   * Parse an implementation plan document to extract phases and tasks
   */
  private parseImplementationPlan(planPath: string): ImplementationPhase[] {
    const content = readFileSync(planPath, 'utf8');
    const phases: ImplementationPhase[] = [];

    // Simple regex-based parsing for common markdown formats
    const phaseMatches = content.match(/^##\s+(.+?)$/gm) || [];
    const lines = content.split('\n');

    let currentPhaseIndex = -1;
    let taskCounter = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Match phase headers (## Phase X: Name)
      const phaseMatch = line.match(/^##\s+(.+?)$/);
      if (phaseMatch) {
        currentPhaseIndex++;
        const phaseName = phaseMatch[1];
        const estimatedDays = this.extractEstimatedDays(phaseName);
        
        phases.push({
          id: `phase-${currentPhaseIndex + 1}`,
          name: phaseName,
          description: this.extractPhaseDescription(lines, i),
          status: 'pending',
          estimatedDays,
          tasks: []
        });
        continue;
      }

      // Match task items (- [ ] Task name or ### Task name)
      const taskMatch = line.match(/^[-*]\s*\[\s*\]\s*(.+)$/) || line.match(/^###\s+(.+)$/);
      if (taskMatch && currentPhaseIndex >= 0) {
        taskCounter++;
        const taskName = taskMatch[1];
        
        phases[currentPhaseIndex].tasks.push({
          id: `task-${taskCounter}`,
          name: taskName,
          description: this.extractTaskDescription(lines, i),
          status: 'pending',
          priority: this.determinePriority(taskName),
          estimatedHours: this.extractEstimatedHours(taskName)
        });
      }
    }

    return phases;
  }

  /**
   * Update progress for a specific phase or task
   */
  updateProgress(
    instance: IterationInstance, 
    phaseId: string, 
    taskId?: string, 
    status?: 'pending' | 'in_progress' | 'completed' | 'blocked',
    notes?: string
  ): void {
    if (!instance.progress) {
      this.initializeProgress(instance);
    }

    const progress = instance.progress!;
    const phase = progress.phases.find(p => p.id === phaseId);
    
    if (!phase) {
      console.log(chalk.yellow(`⚠️  Phase ${phaseId} not found`));
      return;
    }

    if (taskId) {
      // Update specific task
      const task = phase.tasks.find(t => t.id === taskId);
      if (task && status) {
        const oldStatus = task.status;
        task.status = status;
        
        if (status === 'in_progress' && oldStatus === 'pending') {
          task.startedAt = new Date().toISOString();
        } else if (status === 'completed' && oldStatus !== 'completed') {
          task.completedAt = new Date().toISOString();
          if (task.startedAt) {
            const started = new Date(task.startedAt);
            const completed = new Date(task.completedAt);
            task.actualHours = Math.round((completed.getTime() - started.getTime()) / (1000 * 60 * 60) * 10) / 10;
          }
        }
        
        console.log(chalk.green(`✅ Updated task "${task.name}" to ${status}`));
      }
    } else if (status) {
      // Update entire phase
      const oldStatus = phase.status;
      phase.status = status;
      
      if (status === 'in_progress' && oldStatus === 'pending') {
        phase.startedAt = new Date().toISOString();
        progress.currentPhase = phaseId;
      } else if (status === 'completed' && oldStatus !== 'completed') {
        phase.completedAt = new Date().toISOString();
        if (phase.startedAt) {
          const started = new Date(phase.startedAt);
          const completed = new Date(phase.completedAt);
          phase.actualDays = Math.round((completed.getTime() - started.getTime()) / (1000 * 60 * 60 * 24) * 10) / 10;
        }
      }
      
      console.log(chalk.green(`✅ Updated phase "${phase.name}" to ${status}`));
    }

    // Recalculate overall progress
    this.recalculateProgress(progress);
    
    // Update timestamp
    progress.lastUpdated = new Date().toISOString();

    // Save to registry
    this.saveProgressToRegistry(instance);
  }

  /**
   * Recalculate overall progress based on completed tasks
   */
  private recalculateProgress(progress: IterationProgress): void {
    const allTasks = progress.phases.flatMap(p => p.tasks);
    const completedTasks = allTasks.filter(t => t.status === 'completed');
    
    progress.overallProgress = allTasks.length > 0 
      ? Math.round((completedTasks.length / allTasks.length) * 100)
      : 0;

    // Update current phase based on progress
    const inProgressPhase = progress.phases.find(p => p.status === 'in_progress');
    if (inProgressPhase) {
      progress.currentPhase = inProgressPhase.id;
    } else {
      // Find the next pending phase
      const nextPhase = progress.phases.find(p => p.status === 'pending');
      progress.currentPhase = nextPhase?.id;
    }
  }

  /**
   * Generate a progress report
   */
  generateProgressReport(instance: IterationInstance): string {
    if (!instance.progress) {
      return 'No progress tracking initialized for this iteration.';
    }

    const progress = instance.progress;
    const report = [];
    
    report.push(chalk.bold.blue(`📊 Progress Report: ${instance.name}`));
    report.push(chalk.gray(`Last Updated: ${new Date(progress.lastUpdated).toLocaleString()}`));
    report.push('');
    
    report.push(chalk.bold(`Overall Progress: ${progress.overallProgress}%`));
    const progressBar = this.createProgressBar(progress.overallProgress);
    report.push(progressBar);
    report.push('');

    if (progress.currentPhase) {
      const currentPhase = progress.phases.find(p => p.id === progress.currentPhase);
      if (currentPhase) {
        report.push(chalk.bold.yellow(`🔄 Current Phase: ${currentPhase.name}`));
        report.push('');
      }
    }

    // Phase summary
    report.push(chalk.bold('📋 Phases:'));
    for (const phase of progress.phases) {
      const icon = this.getStatusIcon(phase.status);
      const taskSummary = this.getTaskSummary(phase);
      report.push(`  ${icon} ${phase.name} ${chalk.gray(taskSummary)}`);
    }

    return report.join('\n');
  }

  /**
   * Save progress to the registry file
   */
  private saveProgressToRegistry(instance: IterationInstance): void {
    // This would integrate with the registry system
    // For now, just update the iteration status file
    const statusPath = join(instance.workspacePath, 'ITERATION_STATUS.md');
    this.generateStatusMarkdown(instance, statusPath);
  }

  /**
   * Generate status markdown file
   */
  private generateStatusMarkdown(instance: IterationInstance, outputPath: string): void {
    if (!instance.progress) return;

    const progress = instance.progress;
    const lines = [];
    
    lines.push(`# ${instance.name} - Progress Status`);
    lines.push('');
    lines.push(`**Last Updated**: ${new Date(progress.lastUpdated).toLocaleString()}`);
    lines.push(`**Overall Progress**: ${progress.overallProgress}%`);
    
    if (progress.currentPhase) {
      const currentPhase = progress.phases.find(p => p.id === progress.currentPhase);
      if (currentPhase) {
        lines.push(`**Current Phase**: ${currentPhase.name}`);
      }
    }
    
    lines.push('');
    lines.push('## 📊 Progress Overview');
    lines.push('');
    
    for (const phase of progress.phases) {
      const status = this.getStatusEmoji(phase.status);
      lines.push(`### ${status} ${phase.name}`);
      
      if (phase.description) {
        lines.push(phase.description);
      }
      
      const taskSummary = this.getTaskSummary(phase);
      lines.push(`**Tasks**: ${taskSummary}`);
      
      if (phase.estimatedDays) {
        lines.push(`**Estimated**: ${phase.estimatedDays} days`);
      }
      
      if (phase.actualDays) {
        lines.push(`**Actual**: ${phase.actualDays} days`);
      }
      
      if (phase.tasks.length > 0) {
        lines.push('');
        lines.push('**Task Details:**');
        for (const task of phase.tasks) {
          const taskStatus = this.getStatusEmoji(task.status);
          lines.push(`- ${taskStatus} ${task.name}`);
        }
      }
      
      lines.push('');
    }

    writeFileSync(outputPath, lines.join('\n'));
  }

  // Helper methods
  private extractEstimatedDays(text: string): number | undefined {
    const match = text.match(/\(Days?\s+(\d+)[-–]?(\d+)?\)/i);
    if (match) {
      return parseInt(match[1]);
    }
    return undefined;
  }

  private extractPhaseDescription(lines: string[], startIndex: number): string {
    // Look for description in next few lines
    for (let i = startIndex + 1; i < Math.min(startIndex + 5, lines.length); i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('#') && !line.startsWith('-')) {
        return line;
      }
    }
    return '';
  }

  private extractTaskDescription(lines: string[], startIndex: number): string {
    // Look for indented description
    for (let i = startIndex + 1; i < Math.min(startIndex + 3, lines.length); i++) {
      const line = lines[i];
      if (line.startsWith('  ') && line.trim()) {
        return line.trim();
      }
    }
    return '';
  }

  private extractEstimatedHours(text: string): number | undefined {
    const match = text.match(/\((\d+\.?\d*)\s*h(?:ours?)?\)/i);
    if (match) {
      return parseFloat(match[1]);
    }
    return undefined;
  }

  private determinePriority(taskName: string): 'low' | 'medium' | 'high' | 'critical' {
    const text = taskName.toLowerCase();
    if (text.includes('critical') || text.includes('urgent')) return 'critical';
    if (text.includes('high') || text.includes('important')) return 'high';
    if (text.includes('low') || text.includes('optional')) return 'low';
    return 'medium';
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return chalk.green('✅');
      case 'in_progress': return chalk.yellow('🔄');
      case 'blocked': return chalk.red('🚫');
      default: return chalk.gray('⏸️');
    }
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      case 'blocked': return '🚫';
      default: return '⏸️';
    }
  }

  private getTaskSummary(phase: ImplementationPhase): string {
    const total = phase.tasks.length;
    const completed = phase.tasks.filter(t => t.status === 'completed').length;
    const inProgress = phase.tasks.filter(t => t.status === 'in_progress').length;
    
    if (total === 0) return '(No tasks defined)';
    return `(${completed}/${total} completed${inProgress > 0 ? `, ${inProgress} in progress` : ''})`;
  }

  private createProgressBar(percentage: number, width: number = 20): string {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    
    const color = percentage < 30 ? chalk.red : percentage < 70 ? chalk.yellow : chalk.green;
    return `${color(bar)} ${percentage}%`;
  }
}