const Database = require('./database');

class DataAccess {
    constructor() {
        this.db = new Database();
    }

    // Team operations
    async getAllTeams() {
        try {
            const teams = await this.db.query(`
                SELECT t.id, t.name, t.created_at, t.updated_at
                FROM teams t
                ORDER BY t.name
            `);

            // Get folders for each team
            for (let team of teams) {
                team.folders = await this.getTeamFolders(team.id);
            }

            return teams;
        } catch (error) {
            console.error('Error getting all teams:', error);
            throw error;
        }
    }

    async getTeamById(teamId) {
        try {
            const team = await this.db.get(`
                SELECT t.id, t.name, t.created_at, t.updated_at
                FROM teams t
                WHERE t.id = ?
            `, [teamId]);

            if (team) {
                team.folders = await this.getTeamFolders(teamId);
            }

            return team;
        } catch (error) {
            console.error('Error getting team by ID:', error);
            throw error;
        }
    }

    async getTeamFolders(teamId) {
        try {
            const folders = await this.db.query(`
                SELECT folder_path
                FROM team_folders
                WHERE team_id = ?
                ORDER BY folder_path
            `, [teamId]);

            return folders.map(f => f.folder_path);
        } catch (error) {
            console.error('Error getting team folders:', error);
            throw error;
        }
    }

    async createTeam(name, folders) {
        try {
            // Start transaction
            await this.db.run('BEGIN TRANSACTION');

            // Insert team
            const result = await this.db.run(`
                INSERT INTO teams (name) VALUES (?)
            `, [name]);

            const teamId = result.id;

            // Insert folders
            for (let folder of folders) {
                await this.db.run(`
                    INSERT INTO team_folders (team_id, folder_path) VALUES (?, ?)
                `, [teamId, folder]);
            }

            // Commit transaction
            await this.db.run('COMMIT');

            // Return the created team
            return await this.getTeamById(teamId);
        } catch (error) {
            // Rollback on error
            await this.db.run('ROLLBACK');
            console.error('Error creating team:', error);
            throw error;
        }
    }

    async updateTeam(teamId, name, folders) {
        try {
            // Start transaction
            await this.db.run('BEGIN TRANSACTION');

            // Update team name
            await this.db.run(`
                UPDATE teams 
                SET name = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [name, teamId]);

            // Delete existing folders
            await this.db.run(`
                DELETE FROM team_folders WHERE team_id = ?
            `, [teamId]);

            // Insert new folders
            for (let folder of folders) {
                await this.db.run(`
                    INSERT INTO team_folders (team_id, folder_path) VALUES (?, ?)
                `, [teamId, folder]);
            }

            // Commit transaction
            await this.db.run('COMMIT');

            // Return the updated team
            return await this.getTeamById(teamId);
        } catch (error) {
            // Rollback on error
            await this.db.run('ROLLBACK');
            console.error('Error updating team:', error);
            throw error;
        }
    }

    async deleteTeam(teamId) {
        try {
            // Check if team has users
            const userCount = await this.db.get(`
                SELECT COUNT(*) as count FROM users WHERE team_id = ?
            `, [teamId]);

            if (userCount.count > 0) {
                throw new Error('Cannot delete team with assigned users. Please reassign users first.');
            }

            // Start transaction
            await this.db.run('BEGIN TRANSACTION');

            // Delete team folders (cascade will handle this, but being explicit)
            await this.db.run(`
                DELETE FROM team_folders WHERE team_id = ?
            `, [teamId]);

            // Delete team
            await this.db.run(`
                DELETE FROM teams WHERE id = ?
            `, [teamId]);

            // Commit transaction
            await this.db.run('COMMIT');

            return true;
        } catch (error) {
            // Rollback on error
            await this.db.run('ROLLBACK');
            console.error('Error deleting team:', error);
            throw error;
        }
    }

    // User operations
    async getAllUsers() {
        try {
            const users = await this.db.query(`
                SELECT u.id, u.name, u.team_id, u.created_at, u.updated_at
                FROM users u
                ORDER BY u.name
            `);

            // Get additional data for each user
            for (let user of users) {
                const team = await this.db.get(`
                    SELECT name FROM teams WHERE id = ?
                `, [user.team_id]);

                user.teamName = team ? team.name : 'Unknown';
                user.customFolders = await this.getUserCustomFolders(user.id);
                user.effectiveFolders = user.customFolders && user.customFolders.length > 0 
                    ? user.customFolders 
                    : await this.getTeamFolders(user.team_id);
                user.isUsingTeamDefault = !user.customFolders || user.customFolders.length === 0;
            }

            return users;
        } catch (error) {
            console.error('Error getting all users:', error);
            throw error;
        }
    }

    async getUserById(userId) {
        try {
            const user = await this.db.get(`
                SELECT u.id, u.name, u.team_id, u.created_at, u.updated_at
                FROM users u
                WHERE u.id = ?
            `, [userId]);

            if (user) {
                const team = await this.db.get(`
                    SELECT name FROM teams WHERE id = ?
                `, [user.team_id]);

                user.teamName = team ? team.name : 'Unknown';
                user.customFolders = await this.getUserCustomFolders(userId);
                user.effectiveFolders = user.customFolders && user.customFolders.length > 0 
                    ? user.customFolders 
                    : await this.getTeamFolders(user.team_id);
                user.isUsingTeamDefault = !user.customFolders || user.customFolders.length === 0;
            }

            return user;
        } catch (error) {
            console.error('Error getting user by ID:', error);
            throw error;
        }
    }

    async getUserCustomFolders(userId) {
        try {
            const folders = await this.db.query(`
                SELECT folder_path
                FROM user_custom_folders
                WHERE user_id = ?
                ORDER BY folder_path
            `, [userId]);

            return folders.map(f => f.folder_path);
        } catch (error) {
            console.error('Error getting user custom folders:', error);
            throw error;
        }
    }

    async createUser(name, teamId, customFolders) {
        try {
            // Start transaction
            await this.db.run('BEGIN TRANSACTION');

            // Insert user
            const result = await this.db.run(`
                INSERT INTO users (name, team_id) VALUES (?, ?)
            `, [name, teamId]);

            const userId = result.id;

            // Insert custom folders if provided
            if (customFolders && customFolders.length > 0) {
                for (let folder of customFolders) {
                    await this.db.run(`
                        INSERT INTO user_custom_folders (user_id, folder_path) VALUES (?, ?)
                    `, [userId, folder]);
                }
            }

            // Commit transaction
            await this.db.run('COMMIT');

            // Return the created user
            return await this.getUserById(userId);
        } catch (error) {
            // Rollback on error
            await this.db.run('ROLLBACK');
            console.error('Error creating user:', error);
            throw error;
        }
    }

    async updateUser(userId, name, teamId, customFolders) {
        try {
            // Start transaction
            await this.db.run('BEGIN TRANSACTION');

            // Update user
            await this.db.run(`
                UPDATE users 
                SET name = ?, team_id = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [name, teamId, userId]);

            // Delete existing custom folders
            await this.db.run(`
                DELETE FROM user_custom_folders WHERE user_id = ?
            `, [userId]);

            // Insert new custom folders if provided
            if (customFolders && customFolders.length > 0) {
                for (let folder of customFolders) {
                    await this.db.run(`
                        INSERT INTO user_custom_folders (user_id, folder_path) VALUES (?, ?)
                    `, [userId, folder]);
                }
            }

            // Commit transaction
            await this.db.run('COMMIT');

            // Return the updated user
            return await this.getUserById(userId);
        } catch (error) {
            // Rollback on error
            await this.db.run('ROLLBACK');
            console.error('Error updating user:', error);
            throw error;
        }
    }

    async deleteUser(userId) {
        try {
            // Start transaction
            await this.db.run('BEGIN TRANSACTION');

            // Delete user custom folders
            await this.db.run(`
                DELETE FROM user_custom_folders WHERE user_id = ?
            `, [userId]);

            // Delete user
            await this.db.run(`
                DELETE FROM users WHERE id = ?
            `, [userId]);

            // Commit transaction
            await this.db.run('COMMIT');

            return true;
        } catch (error) {
            // Rollback on error
            await this.db.run('ROLLBACK');
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    // Close database connection
    close() {
        this.db.close();
    }
}

module.exports = DataAccess;
