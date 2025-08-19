require('dotenv').config();
const { Pool } = require('pg');

// Database configuration
if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set in .env file');
    process.exit(1);
}

// Use the DATABASE_URL as provided, since it already has sslmode=require
let connectionString = process.env.DATABASE_URL;

const pool = new Pool({ 
    connectionString,
    ssl: {
        rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to PostgreSQL:', err);
        return;
    }
    console.log('Connected to PostgreSQL database');
    release();
});

// Initialize database schema
async function initializeDatabase() {
    try {
        // Create teams table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS teams (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create team_folders table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS team_folders (
                id SERIAL PRIMARY KEY,
                team_id INTEGER NOT NULL,
                folder_path VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
                UNIQUE(team_id, folder_path)
            )
        `);

        // Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                team_id INTEGER,
                github_id BIGINT UNIQUE,
                github_login VARCHAR(255),
                avatar_url TEXT,
                github_url TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE SET NULL
            )
        `);

        // Create user_custom_folders table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_custom_folders (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                folder_path VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                UNIQUE(user_id, folder_path)
            )
        `);

        // Migration: Update existing users table to allow NULL team_id
        try {
            await pool.query(`
                ALTER TABLE users 
                ALTER COLUMN team_id DROP NOT NULL
            `);
        } catch (err) {
            // Column might already be nullable, ignore error
            console.log('Team_id column migration skipped (already nullable)');
        }

        // Migration: Update foreign key constraint to SET NULL
        try {
            await pool.query(`
                ALTER TABLE users 
                DROP CONSTRAINT IF EXISTS users_team_id_fkey
            `);
            await pool.query(`
                ALTER TABLE users 
                ADD CONSTRAINT users_team_id_fkey 
                FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE SET NULL
            `);
        } catch (err) {
            // Constraint might already be updated, ignore error
            console.log('Foreign key constraint migration skipped');
        }

        // Check if tables exist, create them if they don't
        const tablesExist = await pool.query(`
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_name IN ('teams', 'users', 'team_folders', 'user_custom_folders')
        `);
        
        if (tablesExist.rows[0].count === '0') {
            console.log('Creating database tables...');
        } else {
            console.log('Database tables already exist');
        }

        // No initial sample data - database starts empty
        console.log('Database starts empty - no sample data inserted');

        console.log('Database initialized successfully');
    } catch (err) {
        console.error('Error initializing database:', err);
        throw err;
    }
}

// Database operations
const db = {
    // Team operations
    async getAllTeams() {
        const result = await pool.query(`
            SELECT t.*, array_agg(tf.folder_path) as folders
            FROM teams t
            LEFT JOIN team_folders tf ON t.id = tf.team_id
            GROUP BY t.id
            ORDER BY t.name
        `);
        return result.rows.map(team => ({
            ...team,
            folders: team.folders[0] === null ? [] : team.folders
        }));
    },

    async getTeamByName(name) {
        const result = await pool.query(`
            SELECT t.*, array_agg(tf.folder_path) as folders
            FROM teams t
            LEFT JOIN team_folders tf ON t.id = tf.team_id
            WHERE t.name = $1
            GROUP BY t.id
        `, [name]);
        
        if (result.rows.length === 0) return null;
        
        const team = result.rows[0];
        return {
            ...team,
            folders: team.folders[0] === null ? [] : team.folders
        };
    },

    async getTeamById(teamId) {
        const result = await pool.query(`
            SELECT t.*, array_agg(tf.folder_path) as folders
            FROM teams t
            LEFT JOIN team_folders tf ON t.id = tf.team_id
            WHERE t.id = $1
            GROUP BY t.id
        `, [teamId]);
        
        if (result.rows.length === 0) return null;
        
        const team = result.rows[0];
        return {
            ...team,
            folders: team.folders[0] === null ? [] : team.folders
        };
    },

    async createTeam(name, folders) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Insert team
            const teamResult = await client.query(
                'INSERT INTO teams (name) VALUES ($1) RETURNING *',
                [name]
            );
            const teamId = teamResult.rows[0].id;

            // Insert folders
            for (const folder of folders) {
                await client.query(
                    'INSERT INTO team_folders (team_id, folder_path) VALUES ($1, $2)',
                    [teamId, folder]
                );
            }

            await client.query('COMMIT');
            return this.getTeamById(teamId);
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    async updateTeam(teamId, name, folders) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Update team name
            await client.query(
                'UPDATE teams SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [name, teamId]
            );

            // Delete existing folders
            await client.query('DELETE FROM team_folders WHERE team_id = $1', [teamId]);

            // Insert new folders
            for (const folder of folders) {
                await client.query(
                    'INSERT INTO team_folders (team_id, folder_path) VALUES ($1, $2)',
                    [teamId, folder]
                );
            }

            await client.query('COMMIT');
            return this.getTeamById(teamId);
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    async deleteTeam(teamId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Set team_id to NULL for users in this team instead of blocking deletion
            await client.query(
                'UPDATE users SET team_id = NULL WHERE team_id = $1',
                [teamId]
            );

            // Delete team (cascade will handle folders)
            await client.query('DELETE FROM teams WHERE id = $1', [teamId]);

            await client.query('COMMIT');
            return true;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    // User operations
    async getAllUsers() {
        try {
            const result = await pool.query(`
                WITH user_folders AS (
                    SELECT 
                        u.*,
                        t.name as team_name,
                        array_remove(array_agg(DISTINCT ucf.folder_path), NULL) as custom_folders,
                        array_remove(array_agg(DISTINCT tf.folder_path), NULL) as team_folders
                    FROM users u
                    LEFT JOIN teams t ON u.team_id = t.id
                    LEFT JOIN user_custom_folders ucf ON u.id = ucf.user_id
                    LEFT JOIN team_folders tf ON t.id = tf.team_id
                    GROUP BY u.id, t.name
                )
                SELECT 
                    id,
                    name,
                    team_id,
                    github_id,
                    github_login,
                    avatar_url,
                    github_url,
                    team_name,
                    CASE 
                        WHEN custom_folders[1] IS NULL THEN NULL 
                        ELSE custom_folders 
                    END as custom_folders,
                    CASE 
                        WHEN custom_folders[1] IS NULL THEN team_folders
                        ELSE array_cat(team_folders, custom_folders)
                    END as effective_folders,
                    CASE 
                        WHEN custom_folders[1] IS NULL THEN true
                        ELSE false
                    END as is_using_team_default,
                    created_at,
                    updated_at
                FROM user_folders
                ORDER BY name
            `);
            
            return result.rows.map(user => ({
                ...user,
                teamId: user.team_id,
                customFolders: user.custom_folders,
                effectiveFolders: user.effective_folders || [],
                isUsingTeamDefault: user.is_using_team_default,
                teamName: user.team_name || 'No Team'
            }));
        } catch (error) {
            console.error('Error in getAllUsers:', error);
            throw error;
        }
    },

    async getUserById(userId) {
        const result = await pool.query(`
            WITH user_folders AS (
                SELECT 
                    u.id,
                    u.name,
                    u.team_id,
                    u.github_id,
                    u.github_login,
                    u.avatar_url,
                    u.github_url,
                    u.created_at,
                    u.updated_at,
                    t.name as team_name,
                    array_agg(DISTINCT ucf.folder_path) as custom_folders,
                    array_agg(DISTINCT tf.folder_path) as team_folders
                FROM users u
                JOIN teams t ON u.team_id = t.id
                LEFT JOIN user_custom_folders ucf ON u.id = ucf.user_id
                LEFT JOIN team_folders tf ON t.id = tf.team_id
                WHERE u.id = $1
                GROUP BY u.id, u.github_id, u.github_login, u.avatar_url, u.github_url, t.name
            )
            SELECT 
                id,
                name,
                team_id,
                github_id,
                github_login,
                avatar_url,
                github_url,
                team_name,
                CASE 
                    WHEN custom_folders[1] IS NULL THEN NULL 
                    ELSE custom_folders 
                END as custom_folders,
                CASE 
                    WHEN custom_folders[1] IS NULL THEN team_folders
                    ELSE array_cat(team_folders, custom_folders)
                END as effective_folders,
                CASE 
                    WHEN custom_folders[1] IS NULL THEN true
                    ELSE false
                END as is_using_team_default,
                created_at,
                updated_at
            FROM user_folders
        `, [userId]);

        if (result.rows.length === 0) return null;

        const user = result.rows[0];
        return {
            ...user,
            customFolders: user.custom_folders,
            effectiveFolders: user.effective_folders,
            isUsingTeamDefault: user.is_using_team_default,
            teamName: user.team_name,
            githubId: user.github_id,
            githubLogin: user.github_login,
            avatarUrl: user.avatar_url,
            githubUrl: user.github_url
        };
    },

               async createUser({ name, teamId, githubId, githubLogin, avatarUrl, githubUrl, customFolders = [] }) {
               const client = await pool.connect();
               try {
                   await client.query('BEGIN');
                   
                   // Check if user already exists
                   let existingUser = null;
                   if (githubId) {
                       const existingResult = await client.query(
                           'SELECT id, team_id FROM users WHERE github_id = $1',
                           [githubId]
                       );
                       existingUser = existingResult.rows[0];
                   }
                   
                   let wasCreated = false;
                   let userId;
                   
                   if (existingUser) {
                       // User exists - update only basic info, preserve team assignment and custom folders
                       const userResult = await client.query(
                           `UPDATE users 
                            SET name = $1, github_login = $2, avatar_url = $3, github_url = $4, updated_at = CURRENT_TIMESTAMP
                            WHERE github_id = $5
                            RETURNING id`,
                           [name, githubLogin, avatarUrl, githubUrl, githubId]
                       );
                       userId = userResult.rows[0].id;
                       wasCreated = false;
                       
                       // Log what was preserved
                       const teamInfo = existingUser.team_id ? `Team ID: ${existingUser.team_id}` : 'No Team';
                       console.log(`🔄 Updated existing user: ${name} (preserved: ${teamInfo})`);
                   } else {
                       // New user - insert with all info
                       const userResult = await client.query(
                           `INSERT INTO users (name, team_id, github_id, github_login, avatar_url, github_url) 
                            VALUES ($1, $2, $3, $4, $5, $6) 
                            RETURNING id`,
                           [name, teamId, githubId, githubLogin, avatarUrl, githubUrl]
                       );
                       userId = userResult.rows[0].id;
                       wasCreated = true;
                       
                       // Insert custom folders for new users only
                       if (customFolders && customFolders.length > 0) {
                           for (const folder of customFolders) {
                               await client.query(
                                   'INSERT INTO user_custom_folders (user_id, folder_path) VALUES ($1, $2)',
                                   [userId, folder]
                               );
                           }
                       }
                   }
       
                   await client.query('COMMIT');
                   
                   // Return user with creation status
                   const user = await this.getUserById(userId);
                   return { ...user, wasCreated };
               } catch (err) {
                   await client.query('ROLLBACK');
                   throw err;
               } finally {
                   client.release();
               }
           },

    async updateUser(userId, name, teamId, customFolders) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Update user
            await client.query(
                'UPDATE users SET name = $1, team_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
                [name, teamId, userId]
            );

            // Delete existing custom folders
            await client.query('DELETE FROM user_custom_folders WHERE user_id = $1', [userId]);

            // Insert new custom folders if provided
            if (customFolders && customFolders.length > 0) {
                for (const folder of customFolders) {
                    await client.query(
                        'INSERT INTO user_custom_folders (user_id, folder_path) VALUES ($1, $2)',
                        [userId, folder]
                    );
                }
            }

            await client.query('COMMIT');
            return this.getUserById(userId);
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    async deleteUser(userId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM users WHERE id = $1', [userId]);
            await client.query('COMMIT');
            return true;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
};

// Initialize database and export when ready
async function init() {
    try {
        await initializeDatabase();
        return db;
    } catch (err) {
        console.error('Failed to initialize database:', err);
        throw err;
    }
}

module.exports = init();
