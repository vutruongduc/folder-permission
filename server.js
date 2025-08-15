const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize database and start server
async function startServer() {
    try {
        const db = await require('./db');
        console.log('Database module loaded successfully');
        
        // Routes
        setupRoutes(db);
        
        // Start server
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
        
        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log('\nShutting down gracefully...');
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            console.log('\nShutting down gracefully...');
            process.exit(0);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

function setupRoutes(db) {
    // Get all teams
    app.get('/api/teams', async (req, res) => {
        try {
            const teams = await db.getAllTeams();
            res.json(teams);
        } catch (error) {
            console.error('Error getting teams:', error);
            res.status(500).json({ error: 'Failed to get teams' });
        }
    });

    // Get team by ID
    app.get('/api/teams/:id', async (req, res) => {
        try {
            const team = await db.getTeamById(parseInt(req.params.id));
            if (!team) {
                return res.status(404).json({ error: 'Team not found' });
            }
            res.json(team);
        } catch (error) {
            console.error('Error getting team:', error);
            res.status(500).json({ error: 'Failed to get team' });
        }
    });

    // Create new team
    app.post('/api/teams', async (req, res) => {
        try {
            const { name, folders } = req.body;
            if (!name || !folders || !Array.isArray(folders)) {
                return res.status(400).json({ error: 'Name and folders array are required' });
            }
            
            const newTeam = await db.createTeam(name, folders);
            res.status(201).json(newTeam);
        } catch (error) {
            console.error('Error creating team:', error);
            res.status(500).json({ error: error.message || 'Failed to create team' });
        }
    });

    // Update team
    app.put('/api/teams/:id', async (req, res) => {
        try {
            const teamId = parseInt(req.params.id);
            const { name, folders } = req.body;
            
            if (!name || !folders || !Array.isArray(folders)) {
                return res.status(400).json({ error: 'Name and folders array are required' });
            }
            
            const updatedTeam = await db.updateTeam(teamId, name, folders);
            res.json(updatedTeam);
        } catch (error) {
            console.error('Error updating team:', error);
            res.status(500).json({ error: error.message || 'Failed to update team' });
        }
    });

    // Delete team
    app.delete('/api/teams/:id', async (req, res) => {
        try {
            const teamId = parseInt(req.params.id);
            await db.deleteTeam(teamId);
            res.status(204).send();
        } catch (error) {
            console.error('Error deleting team:', error);
            res.status(500).json({ error: error.message || 'Failed to delete team' });
        }
    });

    // Get all users with effective folders
    app.get('/api/users', async (req, res) => {
        try {
            const users = await db.getAllUsers();
            res.json(users);
        } catch (error) {
            console.error('Error getting users:', error);
            res.status(500).json({ error: 'Failed to get users' });
        }
    });

    // Get user by ID
    app.get('/api/users/:id', async (req, res) => {
        try {
            const user = await db.getUserById(parseInt(req.params.id));
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(user);
        } catch (error) {
            console.error('Error getting user:', error);
            res.status(500).json({ error: 'Failed to get user' });
        }
    });

    // Create new user
    app.post('/api/users', async (req, res) => {
        try {
            const { name, teamId, customFolders } = req.body;
            
            if (!name) {
                return res.status(400).json({ error: 'Name is required' });
            }
            
            // Validate team exists if teamId is provided
            if (teamId) {
                const team = await db.getTeamById(teamId);
                if (!team) {
                    return res.status(400).json({ error: 'Team does not exist' });
                }
            }
            
            const newUser = await db.createUser({ name, teamId, customFolders });
            res.status(201).json(newUser);
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({ error: error.message || 'Failed to create user' });
        }
    });

    // Update user
    app.put('/api/users/:id', async (req, res) => {
        try {
            const userId = parseInt(req.params.id);
            const { name, teamId, customFolders } = req.body;
            
            if (!name) {
                return res.status(400).json({ error: 'Name is required' });
            }
            
            // Validate team exists if teamId is provided
            if (teamId) {
                const team = await db.getTeamById(teamId);
                if (!team) {
                    return res.status(400).json({ error: 'Team does not exist' });
                }
            }
            
            const updatedUser = await db.updateUser(userId, name, teamId, customFolders);
            res.json(updatedUser);
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ error: error.message || 'Failed to update user' });
        }
    });

    // Delete user
    app.delete('/api/users/:id', async (req, res) => {
        try {
            const userId = parseInt(req.params.id);
            await db.deleteUser(userId);
            res.status(204).send();
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ error: error.message || 'Failed to delete user' });
        }
    });

    // Serve the main HTML file
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
}

// Start the server
startServer();
