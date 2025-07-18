#!/usr/bin/env node

/**
 * Verify Setup Script
 * Validates that all required environment variables are configured
 * and tests connections to external services
 */

const chalk = require('chalk');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Required environment variables
const REQUIRED_VARS = {
  // Supabase
  SUPABASE_URL: {
    description: 'Supabase project URL',
    pattern: /^https:\/\/[a-zA-Z0-9]+\.supabase\.co$/,
    sensitive: false
  },
  SUPABASE_ANON_KEY: {
    description: 'Supabase anonymous/public key',
    pattern: /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
    sensitive: false
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    description: 'Supabase service role key',
    pattern: /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
    sensitive: true
  },
  
  // Sentry
  SENTRY_DSN_WIDGET: {
    description: 'Sentry DSN for widget',
    pattern: /^https:\/\/[a-f0-9]+@[a-z0-9]+\.ingest\.sentry\.io\/\d+$/,
    sensitive: false
  },
  SENTRY_DSN_API: {
    description: 'Sentry DSN for API',
    pattern: /^https:\/\/[a-f0-9]+@[a-z0-9]+\.ingest\.sentry\.io\/\d+$/,
    sensitive: false
  },
  SENTRY_AUTH_TOKEN: {
    description: 'Sentry auth token',
    pattern: /^sntrys_[A-Za-z0-9_-]+$/,
    sensitive: true
  },
  
  // Vercel
  VERCEL_TOKEN: {
    description: 'Vercel deployment token',
    pattern: /^[A-Za-z0-9]+$/,
    sensitive: true
  }
};

// Optional environment variables
const OPTIONAL_VARS = {
  CLOUDFLARE_API_TOKEN: {
    description: 'Cloudflare API token',
    pattern: /^[A-Za-z0-9_-]+$/,
    sensitive: true
  },
  CLOUDFLARE_ZONE_ID: {
    description: 'Cloudflare zone ID',
    pattern: /^[a-f0-9]{32}$/,
    sensitive: false
  }
};

async function verifyEnvironmentVariables() {
  console.log(chalk.blue.bold('\n🔍 Verifying Environment Variables...\n'));
  
  let hasErrors = false;
  const results = { valid: [], missing: [], invalid: [] };
  
  // Check required variables
  for (const [varName, config] of Object.entries(REQUIRED_VARS)) {
    const value = process.env[varName];
    
    if (!value) {
      results.missing.push(varName);
      hasErrors = true;
    } else if (config.pattern && !config.pattern.test(value)) {
      results.invalid.push(varName);
      hasErrors = true;
    } else {
      results.valid.push(varName);
    }
  }
  
  // Check optional variables
  for (const [varName, config] of Object.entries(OPTIONAL_VARS)) {
    const value = process.env[varName];
    
    if (value && config.pattern && !config.pattern.test(value)) {
      results.invalid.push(varName);
      console.log(chalk.yellow(`⚠️  Optional variable ${varName} has invalid format`));
    }
  }
  
  // Display results
  if (results.valid.length > 0) {
    console.log(chalk.green('✅ Valid variables:'));
    results.valid.forEach(v => console.log(chalk.green(`   - ${v}`)));
  }
  
  if (results.missing.length > 0) {
    console.log(chalk.red('\n❌ Missing variables:'));
    results.missing.forEach(v => {
      const config = REQUIRED_VARS[v] || OPTIONAL_VARS[v];
      console.log(chalk.red(`   - ${v}: ${config.description}`));
    });
  }
  
  if (results.invalid.length > 0) {
    console.log(chalk.red('\n❌ Invalid format:'));
    results.invalid.forEach(v => {
      const config = REQUIRED_VARS[v] || OPTIONAL_VARS[v];
      console.log(chalk.red(`   - ${v}: ${config.description}`));
    });
  }
  
  return !hasErrors;
}

async function testSupabaseConnection() {
  console.log(chalk.blue.bold('\n🔌 Testing Supabase Connection...\n'));
  
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    // Test basic connection
    const { error } = await supabase.from('_test_connection').select('*').limit(1);
    
    if (error && error.code !== 'PGRST116') { // Table doesn't exist is OK
      throw error;
    }
    
    console.log(chalk.green('✅ Supabase connection successful'));
    return true;
  } catch (error) {
    console.log(chalk.red('❌ Supabase connection failed:'));
    console.log(chalk.red(`   ${error.message}`));
    return false;
  }
}

async function testSentryConnection() {
  console.log(chalk.blue.bold('\n🔌 Testing Sentry Connection...\n'));
  
  try {
    // Parse project ID from DSN
    const widgetDSN = process.env.SENTRY_DSN_WIDGET;
    const projectId = widgetDSN.match(/\/(\d+)$/)?.[1];
    
    if (!projectId) {
      throw new Error('Could not parse project ID from Sentry DSN');
    }
    
    // Note: Sentry doesn't provide a simple health check endpoint
    // so we'll just validate the DSN format
    console.log(chalk.green('✅ Sentry configuration appears valid'));
    console.log(chalk.gray(`   Widget Project ID: ${projectId}`));
    return true;
  } catch (error) {
    console.log(chalk.red('❌ Sentry configuration invalid:'));
    console.log(chalk.red(`   ${error.message}`));
    return false;
  }
}

async function testVercelConnection() {
  console.log(chalk.blue.bold('\n🔌 Testing Vercel Connection...\n'));
  
  try {
    const response = await fetch('https://api.vercel.com/v2/user', {
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const user = await response.json();
    console.log(chalk.green('✅ Vercel connection successful'));
    console.log(chalk.gray(`   Logged in as: ${user.username || user.email}`));
    return true;
  } catch (error) {
    console.log(chalk.red('❌ Vercel connection failed:'));
    console.log(chalk.red(`   ${error.message}`));
    return false;
  }
}

async function main() {
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════╗
║   Collabiteration SaaS Setup Verification ║
╚═══════════════════════════════════════════╝
  `));
  
  // Check if .env.local exists
  const fs = require('fs');
  if (!fs.existsSync('.env.local')) {
    console.log(chalk.red('❌ .env.local file not found!'));
    console.log(chalk.yellow('\nTo fix:'));
    console.log(chalk.yellow('1. Copy .env.example to .env.local'));
    console.log(chalk.yellow('2. Fill in your service credentials'));
    console.log(chalk.yellow('3. Run this script again\n'));
    process.exit(1);
  }
  
  // Verify environment variables
  const varsValid = await verifyEnvironmentVariables();
  
  if (!varsValid) {
    console.log(chalk.yellow('\n📝 Next steps:'));
    console.log(chalk.yellow('1. Copy missing variables from .env.example'));
    console.log(chalk.yellow('2. Get credentials from service dashboards'));
    console.log(chalk.yellow('3. See SECURE_SETUP.md for detailed instructions\n'));
    process.exit(1);
  }
  
  // Test service connections
  console.log(chalk.blue.bold('\n🧪 Testing Service Connections...'));
  
  const results = await Promise.all([
    testSupabaseConnection(),
    testSentryConnection(),
    testVercelConnection()
  ]);
  
  const allPassed = results.every(r => r);
  
  if (allPassed) {
    console.log(chalk.green.bold('\n✅ All checks passed! Your environment is ready.\n'));
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.cyan('1. Run `npm install` to install dependencies'));
    console.log(chalk.cyan('2. Run `npm run dev` to start development'));
    console.log(chalk.cyan('3. Check the implementation plan in SAAS_IMPLEMENTATION_PLAN.md\n'));
  } else {
    console.log(chalk.red.bold('\n❌ Some checks failed. Please fix the issues above.\n'));
    console.log(chalk.yellow('Need help? Check:'));
    console.log(chalk.yellow('- SECURE_SETUP.md for setup instructions'));
    console.log(chalk.yellow('- Service dashboards for correct values'));
    console.log(chalk.yellow('- GitHub issues for common problems\n'));
    process.exit(1);
  }
}

// Run verification
main().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});