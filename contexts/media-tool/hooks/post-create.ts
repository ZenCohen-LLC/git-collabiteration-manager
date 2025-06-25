import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

/**
 * Media Tool post-create hook
 * Sets up the iteration environment with all necessary configurations
 */
export async function setupMediaToolIteration(
  iterationPath: string, 
  iterationName: string,
  context: any
): Promise<void> {
  console.log(chalk.blue('🔧 Setting up Media Tool iteration environment...'));

  try {
    // Change to iteration directory
    process.chdir(iterationPath);

    // 1. Install dependencies
    console.log(chalk.blue('📦 Installing dependencies...'));
    execSync('bun install', { stdio: 'inherit' });

    // 2. Setup environment file
    console.log(chalk.blue('⚙️  Configuring environment...'));
    const envContent = generateEnvFile(context);
    writeFileSync(join(iterationPath, '.env.iteration'), envContent);

    // 3. Setup docker compose
    console.log(chalk.blue('🐳 Configuring Docker services...'));
    const dockerContent = generateDockerCompose(context);
    writeFileSync(join(iterationPath, 'docker-compose.yml'), dockerContent);

    // 4. Update package.json with iteration scripts
    console.log(chalk.blue('📝 Adding iteration scripts...'));
    updatePackageJsonScripts(iterationPath, context);

    // 5. Create .gitignore additions for iteration
    const gitignoreAdditions = `
# Git Iteration Manager
.env.iteration
.git-iteration-*
docker-compose.override.yml
`;
    
    const gitignorePath = join(iterationPath, '.gitignore');
    if (existsSync(gitignorePath)) {
      execSync(`echo "${gitignoreAdditions}" >> .gitignore`, { stdio: 'inherit' });
    }

    console.log(chalk.green('✅ Media Tool iteration setup complete!'));
    console.log(chalk.yellow('\n📝 Next steps:'));
    console.log(chalk.yellow('   1. bun run iteration:start  # Start all services'));
    console.log(chalk.yellow('   2. bun run iteration:seed   # Seed with development data'));
    console.log(chalk.yellow(`   3. Visit http://localhost:${context.services.frontend.actualPort}`));

  } catch (error) {
    console.error(chalk.red('❌ Setup failed:'), error);
    throw error;
  }
}

function generateEnvFile(context: any): string {
  const template = `# Git Iteration Manager - Media Tool Environment
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

# JWT secrets for local development
JWT_SECRET=local_development_secret_${context.name}
COOKIE_SECRET=local_cookie_secret_${context.name}
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

function updatePackageJsonScripts(iterationPath: string, context: any): void {
  const packageJsonPath = join(iterationPath, 'package.json');
  if (!existsSync(packageJsonPath)) return;

  try {
    const packageJson = JSON.parse(require('fs').readFileSync(packageJsonPath, 'utf8'));
    
    // Add iteration-specific scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      'iteration:info': `echo "🚀 Iteration: ${context.name} | Frontend: http://localhost:${context.services.frontend.actualPort} | Backend: http://localhost:${context.services.backend.actualPort} | DB: ${context.database.schemaName}:${context.database.actualPort}"`,
      'iteration:start': 'concurrently "bun run db:start" "bun run dev:backend" "bun run dev:frontend"',
      'iteration:stop': 'docker compose down',
      'iteration:restart': 'bun run iteration:stop && bun run iteration:start',
      'iteration:seed': 'bun run data:development',
      'iteration:seed:demo': 'bun run data:demo',
      'iteration:seed:presentation': 'bun run data:presentation',
      'dev:backend': `env-cmd -f .env.iteration bun packages/backend/src/index.ts --port ${context.services.backend.actualPort} --watch | pino-pretty`,
      'dev:frontend': `env-cmd -f .env.iteration vite --port ${context.services.frontend.actualPort} --config packages/frontend/vite.config.mjs`,
      'db:start': 'env-cmd -f .env.iteration docker compose up -d',
      'db:stop': 'env-cmd -f .env.iteration docker compose down -v',
      'db:reset': 'env-cmd -f .env.iteration docker compose down -v && docker compose up -d --wait && sleep 2 && bun run iteration:seed',
      'quality:check': 'bun run lint && bun run tsc && bun run test'
    };

    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  } catch (error) {
    console.warn(chalk.yellow('⚠️  Could not update package.json scripts:'), error);
  }
}