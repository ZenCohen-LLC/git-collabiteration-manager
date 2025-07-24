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
export declare class ConventionDetector {
    /**
     * Detect repository conventions from various sources
     */
    detectConventions(projectPath: string): Promise<RepoConventions>;
    /**
     * Parse README.md for conventions
     */
    private parseReadme;
    /**
     * Extract a section from markdown content
     */
    private extractSection;
    /**
     * Parse branch naming conventions from text
     */
    private parseBranchNamingFromText;
    /**
     * Parse commit message conventions from text
     */
    private parseCommitMessagesFromText;
    /**
     * Parse .gitmessage template
     */
    private parseGitMessage;
    /**
     * Parse commitlint configuration
     */
    private parseCommitlint;
    /**
     * Parse commitizen configuration
     */
    private parseCommitizen;
    /**
     * Get default branch naming conventions
     */
    private getDefaultBranchConventions;
    /**
     * Get default commit message conventions
     */
    private getDefaultCommitConventions;
    /**
     * Format branch name according to conventions
     */
    formatBranchName(iterationName: string, conventions: RepoConventions['branchNaming'], jiraTicket?: string): string;
    /**
     * Format commit message according to conventions
     */
    formatCommitMessage(message: string, type: string, conventions: RepoConventions['commitMessages']): string;
}
//# sourceMappingURL=convention-detector.d.ts.map