import { ProjectFingerprint, ProjectContext } from '../types/project-context.js';
export declare class ContextDetector {
    private conventionDetector;
    /**
     * Analyze a project directory and create a fingerprint
     */
    analyzeProject(projectPath: string): Promise<ProjectFingerprint>;
    /**
     * Try to match project against known contexts
     */
    matchKnownContext(fingerprint: ProjectFingerprint, contextsPath: string): Promise<ProjectContext | null>;
    /**
     * Check if a fingerprint matches a known context
     */
    private isContextMatch;
    /**
     * Get directory structure up to 2 levels deep
     */
    private getDirectoryStructure;
    /**
     * Detect frameworks and technologies
     */
    private detectFrameworks;
    /**
     * Find custom markers that identify specific projects
     */
    private findCustomMarkers;
    /**
     * Analyze common file patterns
     */
    private analyzeFilePatterns;
    /**
     * Match git remotes with wildcards
     */
    private matchGitRemote;
    /**
     * Match package.json structure
     */
    private matchPackageJson;
    /**
     * Calculate directory structure similarity
     */
    private calculateDirectorySimilarity;
}
//# sourceMappingURL=context-detector.d.ts.map