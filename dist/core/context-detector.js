"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextDetector = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const convention_detector_js_1 = require("./convention-detector.js");
class ContextDetector {
    conventionDetector = new convention_detector_js_1.ConventionDetector();
    /**
     * Analyze a project directory and create a fingerprint
     */
    async analyzeProject(projectPath) {
        const fingerprint = {
            directories: [],
            frameworks: [],
            customMarkers: [],
            filePatterns: {}
        };
        // Get git remote if available
        try {
            const remote = (0, child_process_1.execSync)('git remote get-url origin', {
                cwd: projectPath,
                encoding: 'utf8'
            }).trim();
            fingerprint.gitRemote = remote;
        }
        catch {
            // No git remote or not a git repo
        }
        // Analyze directory structure
        fingerprint.directories = this.getDirectoryStructure(projectPath);
        // Analyze package.json if it exists
        const packageJsonPath = (0, path_1.join)(projectPath, 'package.json');
        if ((0, fs_1.existsSync)(packageJsonPath)) {
            try {
                fingerprint.packageJson = JSON.parse((0, fs_1.readFileSync)(packageJsonPath, 'utf8'));
            }
            catch {
                // Invalid package.json
            }
        }
        // Check for docker-compose
        fingerprint.dockerCompose = (0, fs_1.existsSync)((0, path_1.join)(projectPath, 'docker-compose.yml')) ||
            (0, fs_1.existsSync)((0, path_1.join)(projectPath, 'docker-compose.yaml'));
        // Detect frameworks
        fingerprint.frameworks = this.detectFrameworks(projectPath, fingerprint);
        // Find custom markers
        fingerprint.customMarkers = this.findCustomMarkers(projectPath);
        // Analyze file patterns
        fingerprint.filePatterns = this.analyzeFilePatterns(projectPath);
        // Detect repository conventions
        fingerprint.conventions = await this.conventionDetector.detectConventions(projectPath);
        return fingerprint;
    }
    /**
     * Try to match project against known contexts
     */
    async matchKnownContext(fingerprint, contextsPath) {
        if (!(0, fs_1.existsSync)(contextsPath)) {
            return null;
        }
        const contextFiles = (0, fs_1.readdirSync)(contextsPath)
            .filter(file => file.endsWith('.json'))
            .filter(file => !file.endsWith('-latest.json')); // Skip latest symlinks
        for (const contextFile of contextFiles) {
            try {
                const contextPath = (0, path_1.join)(contextsPath, contextFile);
                const context = JSON.parse((0, fs_1.readFileSync)(contextPath, 'utf8'));
                if (this.isContextMatch(fingerprint, context)) {
                    // Update metadata
                    context.metadata = {
                        created: context.metadata?.created || new Date().toISOString(),
                        lastUsed: new Date().toISOString(),
                        usageCount: (context.metadata?.usageCount || 0) + 1,
                        description: context.metadata?.description
                    };
                    return context;
                }
            }
            catch {
                // Skip invalid context files
            }
        }
        return null;
    }
    /**
     * Check if a fingerprint matches a known context
     */
    isContextMatch(fingerprint, context) {
        const ctxFingerprint = context.fingerprint;
        // Exact git remote match (highest priority)
        if (fingerprint.gitRemote && ctxFingerprint.gitRemote) {
            if (this.matchGitRemote(fingerprint.gitRemote, ctxFingerprint.gitRemote)) {
                return true;
            }
        }
        // Package.json structure match
        if (fingerprint.packageJson && ctxFingerprint.packageJson) {
            if (this.matchPackageJson(fingerprint.packageJson, ctxFingerprint.packageJson)) {
                return true;
            }
        }
        // Custom markers match (for projects like media-tool with CLAUDE.md)
        if (ctxFingerprint.customMarkers && ctxFingerprint.customMarkers.length > 0) {
            const markerMatches = ctxFingerprint.customMarkers.filter(marker => fingerprint.customMarkers.includes(marker)).length;
            if (markerMatches >= Math.ceil(ctxFingerprint.customMarkers.length * 0.7)) {
                return true;
            }
        }
        // Directory structure similarity
        if (this.calculateDirectorySimilarity(fingerprint.directories, ctxFingerprint.directories) > 0.8) {
            return true;
        }
        return false;
    }
    /**
     * Get directory structure up to 2 levels deep
     */
    getDirectoryStructure(projectPath) {
        const directories = [];
        try {
            const entries = (0, fs_1.readdirSync)(projectPath);
            for (const entry of entries) {
                if (entry.startsWith('.') && entry !== '.github')
                    continue;
                const fullPath = (0, path_1.join)(projectPath, entry);
                if ((0, fs_1.statSync)(fullPath).isDirectory()) {
                    directories.push(entry);
                    // One level deeper
                    try {
                        const subEntries = (0, fs_1.readdirSync)(fullPath);
                        for (const subEntry of subEntries) {
                            if (subEntry.startsWith('.'))
                                continue;
                            const subFullPath = (0, path_1.join)(fullPath, subEntry);
                            if ((0, fs_1.statSync)(subFullPath).isDirectory()) {
                                directories.push(`${entry}/${subEntry}`);
                            }
                        }
                    }
                    catch {
                        // Skip if can't read subdirectory
                    }
                }
            }
        }
        catch {
            // Skip if can't read project directory
        }
        return directories.sort();
    }
    /**
     * Detect frameworks and technologies
     */
    detectFrameworks(projectPath, fingerprint) {
        const frameworks = [];
        // From package.json dependencies
        if (fingerprint.packageJson) {
            const allDeps = {
                ...fingerprint.packageJson.dependencies,
                ...fingerprint.packageJson.devDependencies
            };
            // React
            if (allDeps.react)
                frameworks.push('react');
            if (allDeps.vite)
                frameworks.push('vite');
            if (allDeps['@vitejs/plugin-react'])
                frameworks.push('vite-react');
            // Node.js frameworks
            if (allDeps.express)
                frameworks.push('express');
            if (allDeps.fastify)
                frameworks.push('fastify');
            if (allDeps.next)
                frameworks.push('nextjs');
            // Databases
            if (allDeps['pg-promise'] || allDeps.pg)
                frameworks.push('postgresql');
            if (allDeps.mysql2 || allDeps.mysql)
                frameworks.push('mysql');
            if (allDeps.mongodb)
                frameworks.push('mongodb');
            // Build tools
            if (allDeps.webpack)
                frameworks.push('webpack');
            if (allDeps.typescript)
                frameworks.push('typescript');
            if (allDeps.bun)
                frameworks.push('bun');
            // Testing
            if (allDeps.jest)
                frameworks.push('jest');
            if (allDeps.vitest)
                frameworks.push('vitest');
            if (allDeps['@playwright/test'])
                frameworks.push('playwright');
        }
        // From file existence
        if (fingerprint.dockerCompose)
            frameworks.push('docker');
        if ((0, fs_1.existsSync)((0, path_1.join)(projectPath, 'tsconfig.json')))
            frameworks.push('typescript');
        if ((0, fs_1.existsSync)((0, path_1.join)(projectPath, 'tailwind.config.js')))
            frameworks.push('tailwindcss');
        if ((0, fs_1.existsSync)((0, path_1.join)(projectPath, 'next.config.js')))
            frameworks.push('nextjs');
        // From directory structure
        if (fingerprint.directories.includes('packages'))
            frameworks.push('monorepo');
        if (fingerprint.directories.includes('db/migrations'))
            frameworks.push('database-migrations');
        return [...new Set(frameworks)].sort();
    }
    /**
     * Find custom markers that identify specific projects
     */
    findCustomMarkers(projectPath) {
        const markers = [];
        const markerFiles = [
            'CLAUDE.md',
            'README.md',
            'Justfile',
            '.pre-commit-config.yaml',
            'bunfig.toml',
            'bun.lock'
        ];
        for (const marker of markerFiles) {
            if ((0, fs_1.existsSync)((0, path_1.join)(projectPath, marker))) {
                markers.push(marker);
            }
        }
        // Check for specific directory patterns
        const markerDirs = [
            'db/migrations',
            'packages/frontend',
            'packages/backend',
            'packages/shared',
            'terraform',
            'utils/synthetic-data'
        ];
        for (const markerDir of markerDirs) {
            if ((0, fs_1.existsSync)((0, path_1.join)(projectPath, markerDir))) {
                markers.push(`dir:${markerDir}`);
            }
        }
        return markers.sort();
    }
    /**
     * Analyze common file patterns
     */
    analyzeFilePatterns(projectPath) {
        const patterns = {};
        const checkFiles = [
            'package.json',
            'tsconfig.json',
            'docker-compose.yml',
            'Dockerfile',
            '.eslintrc.js',
            '.prettierrc',
            'jest.config.js',
            'playwright.config.ts'
        ];
        for (const file of checkFiles) {
            patterns[file] = (0, fs_1.existsSync)((0, path_1.join)(projectPath, file));
        }
        return patterns;
    }
    /**
     * Match git remotes with wildcards
     */
    matchGitRemote(actual, pattern) {
        // Convert pattern to regex
        const regexPattern = pattern
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        const regex = new RegExp(regexPattern, 'i');
        return regex.test(actual);
    }
    /**
     * Match package.json structure
     */
    matchPackageJson(actual, expected) {
        // Check for key indicators
        if (expected.workspaces && actual.workspaces) {
            return JSON.stringify(actual.workspaces) === JSON.stringify(expected.workspaces);
        }
        // Check for specific dependencies
        if (expected.dependencies) {
            const actualDeps = { ...actual.dependencies, ...actual.devDependencies };
            for (const dep of Object.keys(expected.dependencies)) {
                if (!actualDeps[dep]) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
    /**
     * Calculate directory structure similarity
     */
    calculateDirectorySimilarity(actual, expected) {
        if (expected.length === 0)
            return 0;
        const matches = expected.filter(dir => actual.includes(dir)).length;
        return matches / expected.length;
    }
}
exports.ContextDetector = ContextDetector;
//# sourceMappingURL=context-detector.js.map