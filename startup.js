#!/usr/bin/env node

// Startup script that imports GitHub users and starts the server
require('dotenv').config();

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting Folder Configuration Tool...');

// Check if GitHub import should be skipped
const skipGitHubImport = process.env.SKIP_GITHUB_IMPORT === 'true' || process.env.SKIP_GITHUB_IMPORT === '1';

// Check if GitHub import is configured
const githubToken = process.env.GITHUB_TOKEN;
const githubOrg = process.env.GITHUB_ORG;

if (skipGitHubImport) {
    console.log('⏭️  GitHub import skipped (SKIP_GITHUB_IMPORT=true)');
} else if (githubToken && githubOrg) {
    console.log(`📥 GitHub import configured for organization: ${githubOrg}`);
    
    try {
        // Check if the import script exists
        if (fs.existsSync('./get-all-github-users.sh')) {
            console.log('🔄 Importing GitHub users...');
            
            // Make script executable and run it
            execSync('chmod +x ./get-all-github-users.sh', { stdio: 'inherit' });
            
            // Run import with filtered output (only show new users)
            const importOutput = execSync(`./get-all-github-users.sh "${githubOrg}" "${githubToken}"`, { 
                encoding: 'utf8',
                env: { ...process.env }
            });
            
            // Filter output to only show new users
            const lines = importOutput.split('\n');
            const newUsers = lines.filter(line => 
                line.includes('🆕 New user created:') || 
                line.includes('🆕 New user:')
            );
            
            if (newUsers.length > 0) {
                console.log('🆕 New users added:');
                newUsers.forEach(user => console.log(`   ${user}`));
            } else {
                console.log('ℹ️  No new users found - all users already exist');
            }
            
            // Show import summary
            const summaryLine = lines.find(line => line.includes('📊 Import Summary:'));
            if (summaryLine) {
                const summaryIndex = lines.indexOf(summaryLine);
                const summaryLines = lines.slice(summaryIndex, summaryIndex + 5);
                console.log('\n📊 Import Summary:');
                summaryLines.slice(1).forEach(line => {
                    if (line.trim()) console.log(`   ${line.trim()}`);
                });
            }
            
            console.log('✅ GitHub users import completed');
        } else {
            console.log('⚠️  GitHub import script not found, skipping import');
        }
    } catch (error) {
        console.error('❌ Error importing GitHub users:', error.message);
        console.log('🔄 Continuing with server startup...');
    }
} else {
    console.log('ℹ️  GitHub import not configured, skipping import');
    if (!githubToken) console.log('   - GITHUB_TOKEN not set in environment');
    if (!githubOrg) console.log('   - GITHUB_ORG not set in environment');
}

console.log('🚀 Starting server...');

// Start the server
require('./server.js');
