#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk').default || require('chalk');
const inquirer = require('inquirer');
const { WorktreeManager } = require('../dist/core/worktree-manager.js');

const manager = new WorktreeManager();

program
  .name('git-collabiteration')
  .description('Context-aware git worktree collabiteration manager')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize collabiteration management in current project')
  .action(async () => {
    try {
      const projectPath = process.cwd();
      const context = await manager.initializeProject(projectPath);
      console.log(chalk.green('✅ Project initialized for collabiteration management'));
      console.log(chalk.blue(`📁 Detected context: ${context.name}`));
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('create <name>')
  .description('Create new collabiteration with worktree')
  .option('--from <branch>', 'Create from specific branch', 'main')
  .option('--description <desc>', 'Add description to iteration')
  .option('--auto-start', 'Automatically start iteration after creation')
  .option('--ticket <ticket>', 'Jira ticket number (e.g., BRAV-1234)')
  .action(async (name, options) => {
    try {
      const projectPath = process.cwd();
      
      // Check if we need to prompt for Jira ticket
      let jiraTicket = options.ticket;
      if (!jiraTicket) {
        // Check if project uses Jira naming convention
        const context = await manager.initializeProject(projectPath);
        if (context.fingerprint?.conventions?.branchNaming?.format?.includes('reference')) {
          const answer = await inquirer.prompt([
            {
              type: 'input',
              name: 'ticket',
              message: 'Enter Jira ticket number (e.g., BRAV-1234) or press Enter to skip:',
              validate: (input) => {
                if (!input) return true; // Allow empty
                return /^[A-Z]+-\d+$/.test(input) || 'Please enter a valid Jira ticket (e.g., BRAV-1234)';
              }
            }
          ]);
          jiraTicket = answer.ticket;
        }
      }
      
      const iteration = await manager.createIteration(name, projectPath, {
        fromBranch: options.from,
        description: options.description,
        autoStart: options.autoStart,
        jiraTicket: jiraTicket
      });
      
      console.log(chalk.green(`✅ Collabiteration '${name}' created successfully!`));
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all collabiterations for current project')
  .action(async () => {
    try {
      const projectPath = process.cwd();
      const collabiterations = manager.listCollabiterations(projectPath);
      
      if (collabiterations.length === 0) {
        console.log(chalk.yellow('📝 No collabiterations found'));
        return;
      }

      console.log(chalk.cyan('\n🌳 Collabiterations:'));
      for (const iteration of collabiterations) {
        const status = getStatusIcon(iteration.status);
        console.log(chalk.cyan(`\n${status} ${iteration.name}`));
        console.log(chalk.gray(`   Branch: ${iteration.branch}`));
        console.log(chalk.gray(`   Created: ${new Date(iteration.created).toLocaleDateString()}`));
        
        if (iteration.services.frontend) {
          console.log(chalk.gray(`   Frontend: http://localhost:${iteration.services.frontend.actualPort}`));
        }
        if (iteration.services.backend) {
          console.log(chalk.gray(`   Backend: http://localhost:${iteration.services.backend.actualPort}`));
        }
        if (iteration.database) {
          console.log(chalk.gray(`   Database: ${iteration.database.schemaName}`));
        }
        if (iteration.prUrl) {
          console.log(chalk.gray(`   PR: ${iteration.prUrl}`));
        }
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('start <name>')
  .description('Start collabiteration services')
  .action(async (name) => {
    try {
      const projectPath = process.cwd();
      await manager.startIteration(name, projectPath);
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('stop <name>')
  .description('Stop collabiteration services')
  .action(async (name) => {
    try {
      const projectPath = process.cwd();
      await manager.stopIteration(name, projectPath);
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('share <name>')
  .description('Share collabiteration via pull request')
  .option('--title <title>', 'Custom PR title')
  .option('--description <desc>', 'PR description')
  .option('--no-extract', 'Disable automatic content extraction from iteration files')
  .option('--interactive', 'Interactive mode - prompts for missing information')
  .option('--force', 'Skip quality checks and force PR creation')
  .action(async (name, options) => {
    try {
      const projectPath = process.cwd();
      const prUrl = await manager.shareIteration(name, projectPath, {
        title: options.title,
        description: options.description,
        extractContent: options.extract !== false,
        interactive: options.interactive
      });
      
      console.log(chalk.green('✅ Iteration shared successfully!'));
      console.log(chalk.blue(`🔗 ${prUrl}`));
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('remove <name>')
  .description('Remove collabiteration and worktree')
  .option('--force', 'Force removal without confirmation')
  .action(async (name, options) => {
    try {
      const projectPath = process.cwd();
      await manager.removeIteration(name, projectPath, options.force);
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('info <name>')
  .description('Show detailed collabiteration information')
  .action(async (name) => {
    try {
      const projectPath = process.cwd();
      const collabiterations = manager.listCollabiterations(projectPath);
      const iteration = collabiterations.find(iter => iter.name === name);
      
      if (!iteration) {
        console.error(chalk.red(`❌ Collabiteration '${name}' not found`));
        process.exit(1);
      }

      console.log(chalk.cyan(`\n📁 Iteration: ${iteration.name}`));
      console.log(chalk.cyan(`🌿 Branch: ${iteration.branch}`));
      console.log(chalk.cyan(`📂 Path: ${iteration.workspacePath}`));
      console.log(chalk.cyan(`📅 Created: ${new Date(iteration.created).toLocaleString()}`));
      console.log(chalk.cyan(`📊 Status: ${iteration.status}`));
      
      if (iteration.lastStarted) {
        console.log(chalk.cyan(`🕐 Last Started: ${new Date(iteration.lastStarted).toLocaleString()}`));
      }

      console.log(chalk.cyan('\n🔧 Services:'));
      for (const [serviceName, service] of Object.entries(iteration.services)) {
        console.log(chalk.gray(`   ${serviceName}: http://localhost:${service.actualPort}`));
      }

      if (iteration.database) {
        console.log(chalk.cyan('\n📊 Database:'));
        console.log(chalk.gray(`   Schema: ${iteration.database.schemaName}`));
        console.log(chalk.gray(`   Port: ${iteration.database.actualPort}`));
      }

      if (iteration.prUrl) {
        console.log(chalk.cyan('\n🔗 Pull Request:'));
        console.log(chalk.gray(`   ${iteration.prUrl}`));
      }

      console.log(chalk.cyan('\n📝 Quick Commands:'));
      console.log(chalk.gray(`   cd ${iteration.workspacePath}`));
      console.log(chalk.gray('   bun run collabiteration:start'));
      console.log(chalk.gray('   bun run collabiteration:stop'));

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

function getStatusIcon(status) {
  switch (status) {
    case 'running': return '🟢';
    case 'stopped': return '🔴';
    case 'shared': return '📤';
    case 'created': return '🟡';
    default: return '⚪';
  }
}

// Global error handling
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('❌ Unhandled error:'), error);
  process.exit(1);
});

program.parse();