require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function importGithubUsers(db) {
    try {
        // Read the JSON file
        const data = fs.readFileSync(path.join(__dirname, 'github_users.json'), 'utf8');
        const users = JSON.parse(data);

        console.log(`Found ${users.length} users to import`);

        // Import each user without team assignment by default
        let newUsers = 0;
        let updatedUsers = 0;
        let skippedUsers = 0;
        
        for (const user of users) {
            try {
                const result = await db.createUser({
                    name: user.login,  // Use GitHub username as name
                    teamId: null,      // No team by default
                    githubId: user.id,
                    githubLogin: user.login,
                    avatarUrl: user.avatar_url,
                    githubUrl: user.html_url,
                    customFolders: []  // No custom folders initially
                });
                
                // Check if this was a new user or an update
                if (result.wasCreated) {
                    newUsers++;
                    console.log(`🆕 New user created: ${user.login} (no team assigned)`);
                } else {
                    updatedUsers++;
                    console.log(`🔄 User updated: ${user.login} (preserved existing data)`);
                }
            } catch (err) {
                console.error(`❌ Error importing user ${user.login}:`, err.message);
                skippedUsers++;
            }
        }
        
                console.log(`\n📊 Import Summary:`);
        console.log(`   New users: ${newUsers}`);
        console.log(`   Updated users: ${updatedUsers}`);
        console.log(`   Skipped users: ${skippedUsers}`);
        console.log(`   Total processed: ${users.length}`);
        
        // Optional: Check for orphaned users (users in DB but not in GitHub list)
        // Uncomment the next line if you want to see users that might have been removed from GitHub
        // await checkOrphanedUsers(users.map(u => u.id));
        
        console.log('Import completed');
        process.exit(0);
    } catch (err) {
        console.error('Import failed:', err);
        process.exit(1);
    }
}

// Optional function to check for users that might have been removed from GitHub
async function checkOrphanedUsers(githubUserIds) {
    try {
        const db = await require('./db');
        const allUsers = await db.getAllUsers();
        
        const orphanedUsers = allUsers.filter(user => 
            user.githubId && !githubUserIds.includes(user.githubId)
        );
        
        if (orphanedUsers.length > 0) {
            console.log(`\n⚠️  Found ${orphanedUsers.length} users in database not in GitHub list:`);
            orphanedUsers.forEach(user => {
                console.log(`   - ${user.name} (${user.githubLogin}) - Team: ${user.teamName || 'No Team'}`);
            });
            console.log('   Note: These users are preserved in the database with their current settings.');
        }
    } catch (err) {
        console.log('Could not check for orphaned users:', err.message);
    }
}

// Import the database module and run the import
require('./db')
    .then(db => importGithubUsers(db))
    .catch(err => {
        console.error('Failed to initialize:', err);
        process.exit(1);
    });
