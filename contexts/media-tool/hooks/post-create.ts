import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

/**
 * Media Tool post-create hook
 * Sets up the collabiteration environment with all necessary configurations
 */
export async function setupMediaToolCollabcollabiteration(
  collabiterationPath: string, 
  collabiterationName: string,
  context: any
): Promise<void> {
  console.log(chalk.blue('🔧 Setting up Media Tool collabiteration environment...'));

  try {
    // Change to collabiteration directory
    process.chdir(collabiterationPath);

    // 1. Install dependencies
    console.log(chalk.blue('📦 Installing dependencies...'));
    execSync('bun install', { stdio: 'inherit' });

    // 2. Setup environment file
    console.log(chalk.blue('⚙️  Configuring environment...'));
    const envContent = generateEnvFile(context);
    writeFileSync(join(collabiterationPath, '.env.collabiteration'), envContent);

    // 3. Setup docker compose
    console.log(chalk.blue('🐳 Configuring Docker services...'));
    const dockerContent = generateDockerCompose(context);
    writeFileSync(join(collabiterationPath, 'docker-compose.yml'), dockerContent);

    // 4. Update package.json with collabiteration scripts
    console.log(chalk.blue('📝 Adding collabiteration scripts...'));
    updatePackageJsonScripts(collabiterationPath, context);

    // 5. Setup authentication bypass for local development
    console.log(chalk.blue('🔓 Configuring authentication bypass...'));
    setupAuthBypass(collabiterationPath, context);

    // 6. Setup Collabiteration Assistant for development tracking
    console.log(chalk.blue('🤖 Adding Collabiteration Assistant...'));
    setupCollabiterationAssistant(collabiterationPath, context);

    // 7. Create .gitignore additions for collabiteration
    const gitignoreAdditions = `
# Git Collabiteration Manager
.env.collabiteration
.git-collabiteration-*
docker-compose.override.yml
`;
    
    const gitignorePath = join(collabiterationPath, '.gitignore');
    if (existsSync(gitignorePath)) {
      execSync(`echo "${gitignoreAdditions}" >> .gitignore`, { stdio: 'inherit' });
    }

    console.log(chalk.green('✅ Media Tool collabiteration setup complete!'));
    console.log(chalk.yellow('\n📝 Next steps:'));
    console.log(chalk.yellow('   1. bun run collabiteration:start  # Start all services'));
    console.log(chalk.yellow('   2. bun run collabiteration:seed   # Seed with development data'));
    console.log(chalk.yellow(`   3. Visit http://localhost:${context.services.frontend.actualPort}`));

  } catch (error) {
    console.error(chalk.red('❌ Setup failed:'), error);
    throw error;
  }
}

function generateEnvFile(context: any): string {
  const template = `# Git Collabiteration Manager - Media Tool Environment
# Iteration: ${context.name}
# Branch: ${context.branch}
# Created: ${new Date().toISOString()}

# Database Configuration
DB_HOST=localhost
DB_PORT=${context.database.actualPort}
DB_NAME=${context.database.schemaName}
DB_USER=postgres
DB_PASSWORD=postgres

# Service Ports
FRONTEND_PORT=${context.services.frontend.actualPort}
BACKEND_PORT=${context.services.backend.actualPort}

# Service URLs
FRONTEND_URL=http://localhost:${context.services.frontend.actualPort}
BACKEND_URL=http://localhost:${context.services.backend.actualPort}
VITE_BACKEND_URL=http://localhost:${context.services.backend.actualPort}

# Environment
NODE_ENV=development
ITERATION_NAME=${context.name}
ITERATION_BRANCH=${context.branch}

# Media Tool Specific (configure as needed)
ZOHO_CLIENT_ID=development_placeholder
ZOHO_CLIENT_SECRET=development_placeholder
ZOHO_REFRESH_TOKEN=development_placeholder

BEESWAX_API_URL=https://sandbox.beeswax.com
BEESWAX_USERNAME=development_placeholder
BEESWAX_PASSWORD=development_placeholder

# Authentication Configuration
TEST_MODE=true
JWT_SECRET=local_development_secret_${context.name}
COOKIE_SECRET=local_cookie_secret_${context.name}

# Database Configuration
DATABASE_CREDS='{"username":"postgres","password":"postgres"}'

# Snowflake Configuration
SNOWFLAKE_HOST=development_placeholder
SNOWFLAKE_ACCOUNT=development_placeholder
SNOWFLAKE_DATABASE=development_placeholder
SNOWFLAKE_WAREHOUSE=development_placeholder
SNOWFLAKE_CREDS='{"username":"development_placeholder","role":"development_placeholder","private_key":"development_placeholder"}'

# Other Configuration
STAGE=dev
ZOHO_SYNC_SCHEDULE="0 0 * * *"
FLYWAY_PLACEHOLDERS_MEDIA_TOOL_USER_PASSWORD=postgres
FLYWAY_PLACEHOLDERS_SNOWFLAKE_LOADER_USER_PASSWORD=postgres
FLYWAY_PLACEHOLDERS_MEDIA_TOOL_DB_NAME_SUFFIX=''
FLYWAY_PLACEHOLDERS_GRAFANA_READER_PASSWORD=postgres

# Auth Configuration
CLOUD_INSTANCE=https://login.microsoftonline.com/
TENANT_ID=development_placeholder
CLIENT_ID=development_placeholder
CLIENT_SECRET=development_placeholder
REDIRECT_URI=http://localhost:${context.services.frontend.actualPort}/auth/redirect
USE_SECURE_COOKIE=false

# Application Configuration
API_KEY=local_development_api_key_${context.name}
ADMIN_PASSWORD=local_admin_password_${context.name}
`;

  return template;
}

function generateDockerCompose(context: any): string {
  const template = `version: '3.9'
services:
  postgres:
    image: public.ecr.aws/docker/library/postgres:16.3
    ports:
      - '${context.database.actualPort}:5432'
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ${context.database.schemaName}
    healthcheck:
      test: ['CMD', 'pg_isready', '-q', '-U', 'postgres']
      interval: 1s
      timeout: 1s
      retries: 5
    volumes:
      - postgres_data_${context.name}:/var/lib/postgresql/data

  flyway:
    image: flyway/flyway:10.16
    command: -url=jdbc:postgresql://postgres:5432/${context.database.schemaName} -ignoreMigrationPatterns="*:missing" -schemas=media_tool,cds -locations="filesystem:/migrations,filesystem:/fixtures" -createSchemas="true" -user=postgres -password=postgres migrate
    volumes:
      - ./db/migrations:/migrations
      - ./db/fixtures:/fixtures
    environment:
      FLYWAY_PLACEHOLDERS_MEDIA_TOOL_USER_PASSWORD: pass
      FLYWAY_PLACEHOLDERS_SNOWFLAKE_LOADER_USER_PASSWORD: pass
      FLYWAY_PLACEHOLDERS_MEDIA_TOOL_DB_NAME_SUFFIX: '_${context.name}'
      FLYWAY_PLACEHOLDERS_GRAFANA_READER_PASSWORD: pass
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data_${context.name}:
    name: media_tool_${context.name}_postgres_data
`;

  return template;
}

function setupAuthBypass(collabiterationPath: string, context: any): void {
  try {
    // 1. Update frontend auth hook to detect localhost:30xx as local dev
    const authHookPath = join(collabiterationPath, 'packages/frontend/src/auth/use-auth.tsx');
    if (existsSync(authHookPath)) {
      let authContent = require('fs').readFileSync(authHookPath, 'utf8');
      
      // Check if localhost:30 detection is already present
      if (!authContent.includes('localhost:30')) {
        // Add local development detection
        authContent = authContent.replace(
          /const isLocal = [^;]+;/,
          `const isLocal = window.location.host.includes('localhost:30');`
        );
        
        // Update useAuth to start logged in for local
        authContent = authContent.replace(
          /const \[isLoggedIn, setIsLoggedIn\] = useState<boolean>\([^)]*\);/,
          `const [isLoggedIn, setIsLoggedIn] = useState<boolean>(isLocal);`
        );
        
        authContent = authContent.replace(
          /const \[loading, setLoading\] = useState<boolean>\([^)]*\);/,
          `const [loading, setLoading] = useState<boolean>(!isLocal);`
        );
        
        authContent = authContent.replace(
          /const \[identity, setIdentity\] = useState[^;]+;/,
          `const [identity, setIdentity] = useState<{ email: string; name: string } | undefined>(\n    isLocal ? { email: 'dev@localhost', name: 'Development User' } : undefined\n  );`
        );
        
        // Add early return for local development in useEffect
        if (!authContent.includes('Skip auth checks for local development')) {
          authContent = authContent.replace(
            /useEffect\(\(\) => \{/,
            `useEffect(() => {\n    // Skip auth checks for local development\n    if (isLocal) {\n      setIsLoggedIn(true);\n      setLoading(false);\n      setIdentity({ email: 'dev@localhost', name: 'Development User' });\n      return;\n    }\n`
          );
        }
        
        writeFileSync(authHookPath, authContent);
      }
    }

    // 2. Update protected route to detect local development
    const protectedRoutePath = join(collabiterationPath, 'packages/frontend/src/auth/protected-route.tsx');
    if (existsSync(protectedRoutePath)) {
      let routeContent = require('fs').readFileSync(protectedRoutePath, 'utf8');
      
      // Check if local bypass is already present
      if (!routeContent.includes('Skip authentication for local development collabiterations')) {
        // Add local development bypass
        routeContent = routeContent.replace(
          /export function ProtectedRoute\(\{ children \}: Props\) \{[^}]+\}/s,
          `export function ProtectedRoute({ children }: Props) {
  const { isLoggedIn, loading, identity } = useAuth();
  const posthog = usePostHog();

  // Skip authentication for local development collabiterations
  if (isLocal) {
    return (
      <IntercomProvider appId={INTERCOM_APP_ID} autoBoot={false}>
        {children}
      </IntercomProvider>
    );
  }

  if (loading) {
    return null;
  } else if (!isLoggedIn) {
    // user is not authenticated
    return <Navigate to="/login" />;
  }`
        );
        
        writeFileSync(protectedRoutePath, routeContent);
      }
    }

    // 3. Update env-utils to detect localhost:30x as local
    const envUtilsPath = join(collabiterationPath, 'packages/frontend/src/utils/env-utils.ts');
    if (existsSync(envUtilsPath)) {
      let envContent = require('fs').readFileSync(envUtilsPath, 'utf8');
      
      // Update isLocal detection to include 30x ports
      envContent = envContent.replace(
        /export const isLocal = [^;]+;/,
        `export const isLocal = host.includes('localhost:300') || host.includes('localhost:30');`
      );
      
      writeFileSync(envUtilsPath, envContent);
    }

    console.log(chalk.green('✅ Authentication bypass configured for local development'));
  } catch (error) {
    console.warn(chalk.yellow('⚠️  Could not setup auth bypass:'), error);
  }
}

function updatePackageJsonScripts(collabiterationPath: string, context: any): void {
  const packageJsonPath = join(collabiterationPath, 'package.json');
  if (!existsSync(packageJsonPath)) return;

  try {
    const packageJson = JSON.parse(require('fs').readFileSync(packageJsonPath, 'utf8'));
    
    // Add collabiteration-specific scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      'collabiteration:info': `echo "🚀 Iteration: ${context.name} | Frontend: http://localhost:${context.services.frontend.actualPort} | Backend: http://localhost:${context.services.backend.actualPort} | DB: ${context.database.schemaName}:${context.database.actualPort}"`,
      'collabiteration:start': 'concurrently "bun run db:start" "bun run dev:backend" "bun run dev:frontend"',
      'collabiteration:stop': 'docker compose down',
      'collabiteration:restart': 'bun run collabiteration:stop && bun run collabiteration:start',
      'collabiteration:seed': 'bun run data:development',
      'collabiteration:seed:demo': 'bun run data:demo',
      'collabiteration:seed:presentation': 'bun run data:presentation',
      'dev:backend': `env-cmd -f .env.collabiteration bun packages/backend/src/index.ts --port ${context.services.backend.actualPort} --watch | pino-pretty`,
      'dev:frontend': `env-cmd -f .env.collabiteration vite --port ${context.services.frontend.actualPort} --config packages/frontend/vite.config.mjs`,
      'db:start': 'env-cmd -f .env.collabiteration docker compose up -d',
      'db:stop': 'env-cmd -f .env.collabiteration docker compose down -v',
      'db:reset': 'env-cmd -f .env.collabiteration docker compose down -v && docker compose up -d --wait && sleep 2 && bun run collabiteration:seed',
      'quality:check': 'bun run lint && bun run tsc && bun run test'
    };

    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  } catch (error) {
    console.warn(chalk.yellow('⚠️  Could not update package.json scripts:'), error);
  }
}

function setupCollabiterationAssistant(collabiterationPath: string, context: any): void {
  try {
    // 1. Add Collabiteration Assistant modal component
    const modalPath = join(collabiterationPath, 'packages/frontend/src/components/iteration-modal.tsx');
    if (!existsSync(modalPath)) {
      const modalContent = `import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faXmark, 
  faFileText, 
  faCodeBranch, 
  faGlobe, 
  faBox, 
  faPlay, 
  faSquare, 
  faRotateLeft 
} from '@fortawesome/pro-light-svg-icons';

interface CollabiterationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CollabiterationModal({ isOpen, onClose }: CollabiterationModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">🤖 Collabiteration Assistant</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex border-b">
          {['overview', 'changes', 'notes', 'tools'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={\`px-4 py-2 capitalize \${
                activeTab === tab ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'
              }\`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 p-4 overflow-auto">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded">
                  <h3 className="font-medium mb-2">Collabiteration Info</h3>
                  <p><strong>Name:</strong> ${context.name}</p>
                  <p><strong>Branch:</strong> collabiteration/${context.name}</p>
                  <p><strong>Created:</strong> {new Date().toLocaleDateString()}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <h3 className="font-medium mb-2">Service URLs</h3>
                  <p><strong>Frontend:</strong> <a href="http://localhost:${context.services.frontend.actualPort}" target="_blank" className="text-blue-600">http://localhost:${context.services.frontend.actualPort}</a></p>
                  <p><strong>Backend:</strong> <a href="http://localhost:${context.services.backend.actualPort}" target="_blank" className="text-blue-600">http://localhost:${context.services.backend.actualPort}</a></p>
                  <p><strong>Database:</strong> localhost:${context.database.actualPort}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'changes' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm">Track Change</button>
                <button className="px-3 py-1 bg-gray-500 text-white rounded text-sm">Refresh</button>
              </div>
              <div className="border rounded p-4 text-center text-gray-500">
                Changes will be tracked here...
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this collabiteration..."
                className="w-full h-64 p-3 border rounded resize-none"
              />
              <button className="px-4 py-2 bg-blue-500 text-white rounded">Save Notes</button>
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button className="p-4 border rounded hover:bg-gray-50 text-left">
                  <FontAwesomeIcon icon={faBox} className="w-5 h-5 mb-2" />
                  <div className="font-medium">Generate Package</div>
                  <div className="text-sm text-gray-600">Export collabiteration</div>
                </button>
                <button className="p-4 border rounded hover:bg-gray-50 text-left">
                  <FontAwesomeIcon icon={faCodeBranch} className="w-5 h-5 mb-2" />
                  <div className="font-medium">Create PR</div>
                  <div className="text-sm text-gray-600">Share collabiteration</div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}`;

      writeFileSync(modalPath, modalContent);
    }

    // 2. Update nav-icons.tsx to include RobotIcon
    const navIconsPath = join(collabiterationPath, 'packages/frontend/src/components/nav-icons.tsx');
    if (existsSync(navIconsPath)) {
      let navContent = require('fs').readFileSync(navIconsPath, 'utf8');
      
      // Add RobotIcon export if not present
      if (!navContent.includes('RobotIcon')) {
        const robotIconComponent = `
export function RobotIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="3" y="11" width="18" height="10" rx="2" ry="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  );
}`;
        
        navContent = navContent.replace(/export \{([^}]+)\};/, `export { $1, RobotIcon };`);
        navContent = navContent + robotIconComponent;
        
        writeFileSync(navIconsPath, navContent);
      }
    }

    // 3. Update sidebar.tsx to include robot button
    const sidebarPath = join(collabiterationPath, 'packages/frontend/src/components/sidebar.tsx');
    if (existsSync(sidebarPath)) {
      let sidebarContent = require('fs').readFileSync(sidebarPath, 'utf8');
      
      // Add CollabiterationModal import and RobotIcon import
      if (!sidebarContent.includes('CollabiterationModal')) {
        sidebarContent = sidebarContent.replace(
          /import.*from.*nav-icons.*/,
          `import { CampaignsIcon, LineItemsIcon, MediaBuysIcon, RobotIcon } from './nav-icons';`
        );
        
        sidebarContent = sidebarContent.replace(
          /import.*React.*from 'react';/,
          `import React, { useState } from 'react';
import { CollabiterationModal } from './iteration-modal';`
        );
        
        // Add state for modal
        sidebarContent = sidebarContent.replace(
          /export function Sidebar.*{/,
          `export function Sidebar() {
  const [isIterationModalOpen, setIsIterationModalOpen] = useState(false);`
        );
        
        // Add robot button to navigation
        const robotButton = `
        <button
          onClick={() => setIsIterationModalOpen(true)}
          className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
          title="Collabiteration Assistant"
        >
          <RobotIcon className="w-6 h-6" />
        </button>`;
        
        // Find the end of the nav buttons and add robot button
        sidebarContent = sidebarContent.replace(
          /<\/nav>/,
          `    ${robotButton}
      </nav>`
        );
        
        // Add modal at the end
        sidebarContent = sidebarContent.replace(
          /<\/div>(\s*);(\s*)$/,
          `    <CollabiterationModal 
        isOpen={isIterationModalOpen} 
        onClose={() => setIsIterationModalOpen(false)} 
      />
    </div>$1;$2`
        );
        
        writeFileSync(sidebarPath, sidebarContent);
      }
    }

    // 4. Update CLAUDE.md with collabiteration isolation rules
    const claudePath = join(collabiterationPath, 'CLAUDE.md');
    if (existsSync(claudePath)) {
      let claudeContent = require('fs').readFileSync(claudePath, 'utf8');
      
      if (!claudeContent.includes('## Collabiteration Isolation Rules')) {
        const isolationRules = `

## Collabiteration Isolation Rules

**IMPORTANT: This is a collabiteration environment - keep work isolated!**

### 🚨 DO NOT:
- Make changes to core business logic or shared utilities
- Modify database schema or migrations  
- Change authentication, authorization, or security systems
- Update shared components used across the app
- Modify build processes, CI/CD, or deployment configurations
- Change shared types, interfaces, or API contracts

### ✅ DO:
- Work within the specific feature/component you're exploring
- Create new components in isolated directories if needed
- Modify local styling and UI elements
- Add temporary debugging or development tools
- Experiment with feature-specific logic and flows
- Use the Collabiteration Assistant (🤖 robot icon) to track changes

### 🎯 Goal:
Keep this collabiteration focused and contained so changes can be easily:
- Reviewed and understood
- Merged or discarded cleanly  
- Shared with teammates
- Converted to proper feature implementation

**Remember: This is for exploration and prototyping, not production changes!**
`;
        
        claudeContent += isolationRules;
        writeFileSync(claudePath, claudeContent);
      }
    }

    console.log(chalk.green('✅ Collabiteration Assistant configured successfully'));
  } catch (error) {
    console.warn(chalk.yellow('⚠️  Could not setup Collabiteration Assistant:'), error);
  }
}