export interface ProjectFingerprint {
    gitRemote?: string;
    packageJson?: any;
    dockerCompose?: boolean;
    directories: string[];
    frameworks: string[];
    customMarkers: string[];
    filePatterns: Record<string, boolean>;
}
export interface ServiceConfig {
    type: string;
    basePort: number;
    directory?: string;
    command: string;
    buildCommand?: string;
    env?: Record<string, string>;
    dependencies?: string[];
}
export interface DatabaseConfig {
    type: 'postgresql' | 'mysql' | 'mongodb' | 'none';
    basePort: number;
    schemaTemplate: string;
    migrations?: {
        enabled: boolean;
        path: string;
        tool: string;
    };
    dataSeeding?: {
        commands: Record<string, string>;
        defaultSeed?: string;
    };
}
export interface IterationConfig {
    workspacePath: string;
    branchPrefix: string;
    autoSeeding: boolean;
    autoInstall: boolean;
    prTemplate?: string;
}
export interface CustomHooks {
    preCreate?: string;
    postCreate?: string;
    preStart?: string;
    postStart?: string;
    preStop?: string;
    postStop?: string;
    preShare?: string;
    postShare?: string;
}
export interface ProjectContext {
    projectId: string;
    name: string;
    version: string;
    fingerprint: ProjectFingerprint;
    database: DatabaseConfig;
    services: Record<string, ServiceConfig>;
    iteration: IterationConfig;
    customHooks?: CustomHooks;
    templates?: Record<string, string>;
    metadata?: {
        created: string;
        lastUsed: string;
        usageCount: number;
        description?: string;
    };
}
export interface ImplementationPhase {
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'blocked';
    startedAt?: string;
    completedAt?: string;
    estimatedDays?: number;
    actualDays?: number;
    dependencies?: string[];
    tasks: ImplementationTask[];
}
export interface ImplementationTask {
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'blocked';
    assignee?: string;
    startedAt?: string;
    completedAt?: string;
    estimatedHours?: number;
    actualHours?: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    blockedReason?: string;
}
export interface IterationProgress {
    currentPhase?: string;
    overallProgress: number;
    phases: ImplementationPhase[];
    lastUpdated: string;
    totalEstimatedDays?: number;
    totalActualDays?: number;
    milestones: {
        name: string;
        targetDate?: string;
        completedDate?: string;
        status: 'pending' | 'completed' | 'missed';
    }[];
}
export interface IterationInstance {
    name: string;
    branch: string;
    workspacePath: string;
    projectContext: ProjectContext;
    services: Record<string, ServiceConfig & {
        actualPort: number;
    }>;
    database?: DatabaseConfig & {
        actualPort: number;
        schemaName: string;
    };
    created: string;
    lastStarted?: string;
    prUrl?: string;
    status: 'created' | 'running' | 'stopped' | 'shared';
    progress?: IterationProgress;
}
export interface GlobalConfig {
    defaultWorkspacePath: string;
    contextStoragePath: string;
    defaultPorts: {
        frontend: number;
        backend: number;
        database: number;
    };
    templates: {
        storePath: string;
    };
    git: {
        defaultBranchPrefix: string;
        autoCommit: boolean;
        autoPush: boolean;
    };
}
//# sourceMappingURL=project-context.d.ts.map