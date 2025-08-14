const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, 'data', 'folders.db');
        this.db = null;
        this.init();
    }

    init() {
        // Ensure data directory exists
        const fs = require('fs');
        const dataDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('Connected to SQLite database');
                this.createTables().then(() => {
                    console.log('Database tables created successfully');
                }).catch(err => {
                    console.error('Error creating tables:', err);
                });
            }
        });
    }

    async createTables() {
        try {
            // Teams table
            await this.run(`
                CREATE TABLE IF NOT EXISTS teams (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Teams folders table (many-to-many relationship)
            await this.run(`
                CREATE TABLE IF NOT EXISTS team_folders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    team_id INTEGER NOT NULL,
                    folder_path TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
                    UNIQUE(team_id, folder_path)
                )
            `);

            // Users table
            await this.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    team_id INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE
                )
            `);

            // User custom folders table (many-to-many relationship)
            await this.run(`
                CREATE TABLE IF NOT EXISTS user_custom_folders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    folder_path TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                    UNIQUE(user_id, folder_path)
                )
            `);

            // Create indexes for better performance
            await this.run('CREATE INDEX IF NOT EXISTS idx_team_folders_team_id ON team_folders(team_id)');
            await this.run('CREATE INDEX IF NOT EXISTS idx_user_custom_folders_user_id ON user_custom_folders(user_id)');
            await this.run('CREATE INDEX IF NOT EXISTS idx_users_team_id ON users(team_id)');

            // Insert initial data if tables are empty
            await this.insertInitialData();
        } catch (error) {
            console.error('Error creating tables:', error);
            throw error;
        }
    }

    async insertInitialData() {
        try {
            // Check if teams table is empty
            const countResult = await this.get('SELECT COUNT(*) as count FROM teams');
            
            if (countResult.count === 0) {
                console.log('Inserting initial data...');
                
                // Insert initial teams
                const devTeamResult = await this.run('INSERT INTO teams (name) VALUES (?)', ['Dev']);
                const devTeamId = devTeamResult.id;
                
                // Insert Dev team folders
                const devFolders = ['/Code', '/Docs'];
                for (let folder of devFolders) {
                    await this.run('INSERT INTO team_folders (team_id, folder_path) VALUES (?, ?)', 
                        [devTeamId, folder]);
                }

                // Insert Design team
                const designTeamResult = await this.run('INSERT INTO teams (name) VALUES (?)', ['Design']);
                const designTeamId = designTeamResult.id;
                
                // Insert Design team folders
                const designFolders = ['/Art', '/UI', '/UX'];
                for (let folder of designFolders) {
                    await this.run('INSERT INTO team_folders (team_id, folder_path) VALUES (?, ?)', 
                        [designTeamId, folder]);
                }

                // Insert initial users
                await this.insertInitialUsers(devTeamId, designTeamId);
                
                console.log('Initial data inserted successfully');
            }
        } catch (error) {
            console.error('Error inserting initial data:', error);
            throw error;
        }
    }

    async insertInitialUsers(devTeamId, designTeamId) {
        try {
            // Insert Alice (Dev team, no custom folders)
            await this.run('INSERT INTO users (name, team_id) VALUES (?, ?)', ['Alice', devTeamId]);
            console.log('Inserted Alice (Dev team)');

            // Insert Bob (Dev team, with custom folders)
            const bobResult = await this.run('INSERT INTO users (name, team_id) VALUES (?, ?)', ['Bob', devTeamId]);
            const bobUserId = bobResult.id;
            
            // Insert Bob's custom folders
            const bobFolders = ['/Code', '/Docs', '/Tests'];
            for (let folder of bobFolders) {
                await this.run('INSERT INTO user_custom_folders (user_id, folder_path) VALUES (?, ?)', 
                    [bobUserId, folder]);
            }
            console.log('Inserted Bob (Dev team, custom folders)');

            // Insert Carol (Design team, no custom folders)
            await this.run('INSERT INTO users (name, team_id) VALUES (?, ?)', ['Carol', designTeamId]);
            console.log('Inserted Carol (Design team)');
        } catch (error) {
            console.error('Error inserting initial users:', error);
            throw error;
        }
    }

    // Generic query method
    query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Generic single row query method
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Generic run method for INSERT, UPDATE, DELETE
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    // Close database connection
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('Database connection closed');
                }
            });
        }
    }
}

module.exports = Database;
