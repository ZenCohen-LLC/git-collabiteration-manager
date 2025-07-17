import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

/**
 * Media Tool post-create hook
 * Sets up the collabiteration environment with all necessary configurations
 */
export async function setupMediaToolCollabiteration(
  collabiterationPath: string, 
  collabiterationName: string,
  context: any
): Promise<void> {
  console.log(chalk.blue('\n🔧 Setting up Media Tool collabiteration environment...\n'));

  try {
    // Change to collabiteration directory
    process.chdir(collabiterationPath);

    // 1. Copy the comprehensive env template
    console.log(chalk.blue('⚙️  Creating environment file with all required variables...'));
    const envTemplate = readFileSync(join(__dirname, '../templates/env.media-tool.template'), 'utf8');
    const envContent = envTemplate
      .replace(/{iterationName}/g, collabiterationName)
      .replace(/{iterationBranch}/g, `iteration/${collabiterationName}`)
      .replace(/{dbPort}/g, context.database.actualPort || '5432')
      .replace(/{dbSchema}/g, context.database.schemaName || 'media_tool')
      .replace(/{frontendPort}/g, context.services.frontend.actualPort || '3000')
      .replace(/{backendPort}/g, context.services.backend.actualPort || '3001')
      .replace(/{createdDate}/g, new Date().toISOString());
    
    writeFileSync(join(collabiterationPath, '.env'), envContent);
    console.log(chalk.green('✅ Created .env file with all required variables'));

    // 2. Install dependencies
    console.log(chalk.blue('\n📦 Installing dependencies...'));
    execSync('bun install', { stdio: 'inherit' });

    // 3. Fix common issues
    console.log(chalk.blue('\n🔧 Fixing common iteration issues...'));
    fixCommonIssues(collabiterationPath);

    // 4. Start database and run migrations
    console.log(chalk.blue('\n🗄️  Starting database and running migrations...'));
    execSync('bun run db:start', { stdio: 'inherit' });
    
    // Wait for database to be ready
    console.log(chalk.gray('   Waiting for database to be ready...'));
    execSync('sleep 10', { stdio: 'inherit' });

    // 5. Setup for test mode authentication
    console.log(chalk.blue('\n🔓 Setting up test mode authentication...'));
    console.log(chalk.green('✅ TEST_MODE=true is already set in .env'));

    // 6. Show helpful information
    console.log(chalk.green('\n✅ Media Tool collabiteration setup complete!\n'));
    console.log(chalk.cyan('🌐 Service URLs:'));
    console.log(chalk.white(`   Frontend: http://localhost:${context.services.frontend.actualPort || '3000'}`));
    console.log(chalk.white(`   Backend:  http://localhost:${context.services.backend.actualPort || '3001'}`));
    console.log(chalk.white(`   Database: localhost:${context.database.actualPort || '5432'}\n`));

    console.log(chalk.yellow('📝 Quick Start Commands:'));
    console.log(chalk.white('   1. Start services:'));
    console.log(chalk.gray('      # Start backend in one terminal:'));
    console.log(chalk.white('      source .env && bun packages/backend/src/index.ts\n'));
    console.log(chalk.gray('      # Start frontend in another terminal:'));
    console.log(chalk.white('      bun dev:frontend\n'));
    
    console.log(chalk.white('   2. (Optional) Seed test data:'));
    console.log(chalk.gray('      # Note: Data seeding has schema issues, you can:'));
    console.log(chalk.gray('      # - Work without seeded data (recommended)'));
    console.log(chalk.gray('      # - Or manually create test data in the UI\n'));

    console.log(chalk.cyan('🔑 Authentication:'));
    console.log(chalk.white('   TEST_MODE is enabled - no login required!\n'));

    console.log(chalk.red('⚠️  Known Issues:'));
    console.log(chalk.white('   - Data seeding scripts have schema prefix issues'));
    console.log(chalk.white('   - Cross-iteration imports have been fixed automatically'));
    console.log(chalk.white('   - If you see auth errors, ensure TEST_MODE=true in .env\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ Setup failed:'), error);
    console.log(chalk.yellow('\n💡 Troubleshooting Tips:'));
    console.log(chalk.white('   1. Ensure Docker is running'));
    console.log(chalk.white('   2. Check that ports 3000, 3001, and 5432 are available'));
    console.log(chalk.white('   3. Try running: bun install'));
    console.log(chalk.white('   4. Check .env file has TEST_MODE=true\n'));
    throw error;
  }
}

/**
 * Fix common issues that break iterations
 */
function fixCommonIssues(collabiterationPath: string): void {
  // 1. Fix cross-iteration imports
  const problematicFiles = [
    'packages/frontend/src/hooks/use-line-item-type-annotations.ts',
    'packages/frontend/src/features/line-items/new-line-item-form.tsx'
  ];

  for (const file of problematicFiles) {
    const filePath = join(collabiterationPath, file);
    if (existsSync(filePath)) {
      let content = readFileSync(filePath, 'utf8');
      
      // Fix imports that reference other iterations
      if (content.includes('../../../iterations/')) {
        console.log(chalk.gray(`   Fixing cross-iteration imports in ${file}...`));
        
        // Comment out problematic imports
        content = content.replace(
          /import.*from ['"]\.\.\/\.\.\/\.\.\/iterations\/[^'"]+['"]/g,
          (match) => `// ${match} // Commented out - cross-iteration import`
        );
        
        // Add mock implementations for missing imports
        if (file.includes('use-line-item-type-annotations')) {
          content = content.replace(
            'const { addAnnotation } = useAnnotations();',
            '// Mock implementation for iteration without annotations context\n  const addAnnotation = () => {};'
          );
        }
        
        writeFileSync(filePath, content);
        console.log(chalk.green(`   ✅ Fixed ${file}`));
      }
    }
  }

  // 2. Ensure proper schema setup for database operations
  const dbConfigPath = join(collabiterationPath, 'packages/backend/src/db/postgres.ts');
  if (existsSync(dbConfigPath)) {
    let dbContent = readFileSync(dbConfigPath, 'utf8');
    
    // Check if schema setup is missing
    if (!dbContent.includes('search_path')) {
      console.log(chalk.gray('   Adding schema search path configuration...'));
      
      // Add search_path configuration after db connection
      dbContent = dbContent.replace(
        /const innerDb = pgp\(dbConfig\);/,
        `const innerDb = pgp(dbConfig);

// Set search_path for media_tool schema
innerDb.$pool.options.schema = 'media_tool';`
      );
      
      writeFileSync(dbConfigPath, dbContent);
      console.log(chalk.green('   ✅ Added schema configuration'));
    }
  }

  console.log(chalk.green('✅ Fixed common iteration issues'));
}