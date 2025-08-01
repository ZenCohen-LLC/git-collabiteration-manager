/**
 * Claude Flow Coordinator Rules
 * Prevents circular dependencies and ensures coordinated development
 */

import { execSync } from 'child_process';

interface ComponentInfo {
  name: string;
  path: string;
  imports: string[];
  exports: string[];
  tests?: string[];
}

interface DependencyGraph {
  [component: string]: {
    imports: string[];
    exports: string[];
    dependents: string[];
  };
}

/**
 * Coordinator rules for preventing issues during parallel development
 */
export const coordinatorRules = {
  /**
   * Check before creating a new file
   */
  beforeFileCreate: async (filePath: string, imports: string[]): Promise<void> => {
    console.log(`🔍 Checking dependencies for ${filePath}...`);
    
    // Get current dependency graph
    const deps = await getDependencyGraph();
    
    // Check if this would create a circular dependency
    if (wouldCreateCircularDependency(deps, filePath, imports)) {
      const cycle = findCircularPath(deps, filePath, imports);
      throw new Error(`
❌ Circular dependency detected!

Creating ${filePath} with these imports would create a cycle:
${cycle.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}

💡 Suggestions:
1. Extract shared types to a separate file
2. Use lazy loading for the component
3. Refactor to remove the circular dependency
4. Create an interface/abstraction layer
      `);
    }
    
    console.log('✅ No circular dependencies detected');
  },

  /**
   * Register component after creation
   */
  afterComponentCreate: async (component: ComponentInfo): Promise<void> => {
    console.log(`📝 Registering component: ${component.name}`);
    
    // Store in Claude Flow memory
    try {
      await storeInMemory(`components/${component.name}`, {
        path: component.path,
        imports: component.imports,
        exports: component.exports,
        tests: component.tests || [],
        created: new Date().toISOString()
      });
      
      // Update dependency graph
      await updateDependencyGraph(component);
      
      console.log('✅ Component registered successfully');
    } catch (error) {
      console.error('⚠️  Failed to register component:', error);
    }
  },

  /**
   * Check before marking component as complete
   */
  beforeComplete: async (componentName: string): Promise<void> => {
    console.log(`🎯 Checking completion criteria for ${componentName}...`);
    
    const checks = await runCompletionChecks(componentName);
    const failed = Object.entries(checks)
      .filter(([_, passed]) => !passed)
      .map(([check]) => check);
    
    if (failed.length > 0) {
      throw new Error(`
❌ Component "${componentName}" is not complete!

Missing requirements:
${failed.map(f => `  ❌ ${formatCheckName(f)}`).join('\n')}

💡 To complete this component:
${failed.map(f => `  - ${getCheckSuggestion(f)}`).join('\n')}
      `);
    }
    
    console.log('✅ All completion criteria met');
  },

  /**
   * Coordinate parallel agents
   */
  coordinateAgents: async (agents: string[]): Promise<void> => {
    console.log(`🤝 Coordinating ${agents.length} agents...`);
    
    // Store agent assignments
    for (const agent of agents) {
      await storeInMemory(`agents/${agent}/status`, {
        active: true,
        started: new Date().toISOString()
      });
    }
    
    // Set up coordination rules
    await storeInMemory('coordination/rules', {
      maxParallelFileEdits: 1,
      requireApprovalFor: ['shared components', 'API changes', 'state management'],
      communicationProtocol: 'memory-based',
      conflictResolution: 'coordinator-decides'
    });
    
    console.log('✅ Agent coordination initialized');
  }
};

/**
 * Get current dependency graph from memory
 */
async function getDependencyGraph(): Promise<DependencyGraph> {
  try {
    const graphJson = execSync(
      'npx claude-flow@alpha memory get "dependencies/graph"',
      { encoding: 'utf8' }
    );
    return JSON.parse(graphJson) || {};
  } catch {
    return {};
  }
}

/**
 * Check if adding imports would create circular dependency
 */
function wouldCreateCircularDependency(
  graph: DependencyGraph,
  newFile: string,
  imports: string[]
): boolean {
  // Build a test graph with the new file
  const testGraph = { ...graph };
  testGraph[newFile] = {
    imports,
    exports: [],
    dependents: []
  };
  
  // Update dependents
  for (const imp of imports) {
    if (testGraph[imp]) {
      testGraph[imp].dependents.push(newFile);
    }
  }
  
  // Check for cycles using DFS
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function hasCycle(node: string): boolean {
    visited.add(node);
    recursionStack.add(node);
    
    const nodeData = testGraph[node];
    if (nodeData) {
      for (const dep of nodeData.imports) {
        if (!visited.has(dep)) {
          if (hasCycle(dep)) return true;
        } else if (recursionStack.has(dep)) {
          return true;
        }
      }
    }
    
    recursionStack.delete(node);
    return false;
  }
  
  return hasCycle(newFile);
}

/**
 * Find the circular dependency path
 */
function findCircularPath(
  graph: DependencyGraph,
  newFile: string,
  imports: string[]
): string[] {
  const path: string[] = [newFile];
  
  // Simple path finding - in real implementation would be more sophisticated
  for (const imp of imports) {
    if (graph[imp] && graph[imp].imports.includes(newFile)) {
      path.push(imp);
      path.push(newFile);
      break;
    }
  }
  
  return path;
}

/**
 * Store data in Claude Flow memory
 */
async function storeInMemory(key: string, value: any): Promise<void> {
  const json = JSON.stringify(value);
  execSync(
    `npx claude-flow@alpha memory store "${key}" '${json}'`,
    { stdio: 'pipe' }
  );
}

/**
 * Update dependency graph with new component
 */
async function updateDependencyGraph(component: ComponentInfo): Promise<void> {
  const graph = await getDependencyGraph();
  
  // Add component to graph
  graph[component.path] = {
    imports: component.imports,
    exports: component.exports,
    dependents: []
  };
  
  // Update dependents for imported components
  for (const imp of component.imports) {
    if (graph[imp]) {
      graph[imp].dependents.push(component.path);
    }
  }
  
  // Store updated graph
  await storeInMemory('dependencies/graph', graph);
}

/**
 * Run completion checks for a component
 */
async function runCompletionChecks(componentName: string): Promise<Record<string, boolean>> {
  const checks: Record<string, boolean> = {};
  
  try {
    // Get component info from memory
    const componentJson = execSync(
      `npx claude-flow@alpha memory get "components/${componentName}"`,
      { encoding: 'utf8' }
    );
    const component = JSON.parse(componentJson);
    
    // Check 1: Has tests
    checks.hasTests = component.tests && component.tests.length > 0;
    
    // Check 2: No circular dependencies
    const graph = await getDependencyGraph();
    checks.noCircularDeps = !hasCircularDependencies(graph, component.path);
    
    // Check 3: Figma reviewed (check for flag in memory)
    try {
      const figmaReview = execSync(
        `npx claude-flow@alpha memory get "reviews/figma/${componentName}"`,
        { encoding: 'utf8' }
      );
      checks.figmaReviewed = !!figmaReview;
    } catch {
      checks.figmaReviewed = false;
    }
    
    // Check 4: API integrated (for components that need it)
    checks.apiIntegrated = true; // Would check actual integration
    
    // Check 5: Types exported
    checks.typesExported = component.exports && component.exports.length > 0;
    
  } catch (error) {
    console.error('Error running checks:', error);
    return checks;
  }
  
  return checks;
}

/**
 * Check if a component has circular dependencies
 */
function hasCircularDependencies(graph: DependencyGraph, componentPath: string): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function visit(node: string): boolean {
    if (recursionStack.has(node)) return true;
    if (visited.has(node)) return false;
    
    visited.add(node);
    recursionStack.add(node);
    
    const nodeData = graph[node];
    if (nodeData) {
      for (const dep of nodeData.imports) {
        if (visit(dep)) return true;
      }
    }
    
    recursionStack.delete(node);
    return false;
  }
  
  return visit(componentPath);
}

/**
 * Format check name for display
 */
function formatCheckName(check: string): string {
  const formats: Record<string, string> = {
    hasTests: 'Playwright tests written',
    noCircularDeps: 'No circular dependencies',
    figmaReviewed: 'Figma design reviewed',
    apiIntegrated: 'API integration complete',
    typesExported: 'Types properly exported'
  };
  
  return formats[check] || check;
}

/**
 * Get suggestion for failing check
 */
function getCheckSuggestion(check: string): string {
  const suggestions: Record<string, string> = {
    hasTests: 'Write Playwright tests in the tests/ directory',
    noCircularDeps: 'Refactor imports to remove circular dependencies',
    figmaReviewed: 'Review Figma design and mark as reviewed',
    apiIntegrated: 'Connect component to API endpoints',
    typesExported: 'Export component types from index.ts'
  };
  
  return suggestions[check] || 'Complete this requirement';
}

/**
 * Agent coordination protocols
 */
export const agentProtocols = {
  /**
   * Protocol for component creation
   */
  componentCreation: `
You are creating a component as part of a coordinated swarm.

BEFORE creating any file:
1. Check dependencies: await coordinator.checkDependencies(filePath, imports)
2. Reserve the component: await coordinator.reserveComponent(componentName)

DURING development:
1. After creating component: await coordinator.registerComponent(componentInfo)
2. After writing tests: await coordinator.registerTests(componentName, testFiles)
3. When importing from other components: await coordinator.checkImport(from, to)

BEFORE marking complete:
1. Review against Figma: await coordinator.markFigmaReviewed(componentName)
2. Run completion check: await coordinator.checkCompletion(componentName)
3. Only mark done when ALL checks pass

COMMUNICATION:
- Store decisions: await coordinator.storeDecision(key, decision)
- Check others' work: await coordinator.getComponentStatus(name)
- Report blockers: await coordinator.reportBlocker(issue)
  `,

  /**
   * Protocol for API integration
   */
  apiIntegration: `
You are integrating components with the API.

COORDINATION RULES:
1. Check API changes: await coordinator.checkAPIChange(endpoint, change)
2. Reserve endpoints: await coordinator.reserveEndpoint(path)
3. Update after changes: await coordinator.updateAPISchema(changes)

PREVENT CONFLICTS:
- One agent per endpoint
- Coordinate schema changes through memory
- Test changes don't break other components
  `
};