const express = require('express');
const cors = require('cors');
const path = require('path');
const DataAccess = require('./dataAccess');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize data access layer
const dataAccess = new DataAccess();

// Routes

// Get all teams
app.get('/api/teams', async (req, res) => {
  try {
    const teams = await dataAccess.getAllTeams();
    res.json(teams);
  } catch (error) {
    console.error('Error getting teams:', error);
    res.status(500).json({ error: 'Failed to get teams' });
  }
});

// Get team by ID
app.get('/api/teams/:id', async (req, res) => {
  try {
    const team = await dataAccess.getTeamById(parseInt(req.params.id));
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
    
    const newTeam = await dataAccess.createTeam(name, folders);
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
    
    const updatedTeam = await dataAccess.updateTeam(teamId, name, folders);
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
    await dataAccess.deleteTeam(teamId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ error: error.message || 'Failed to delete team' });
  }
});

// Get all users with effective folders
app.get('/api/users', async (req, res) => {
  try {
    const users = await dataAccess.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await dataAccess.getUserById(parseInt(req.params.id));
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
    
    if (!name || !teamId) {
      return res.status(400).json({ error: 'Name and teamId are required' });
    }
    
    // Validate team exists
    const team = await dataAccess.getTeamById(teamId);
    if (!team) {
      return res.status(400).json({ error: 'Team does not exist' });
    }
    
    const newUser = await dataAccess.createUser(name, teamId, customFolders);
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
    
    if (!name || !teamId) {
      return res.status(400).json({ error: 'Name and teamId are required' });
    }
    
    // Validate team exists
    const team = await dataAccess.getTeamById(teamId);
    if (!team) {
      return res.status(400).json({ error: 'Team does not exist' });
    }
    
    const updatedUser = await dataAccess.updateUser(userId, name, teamId, customFolders);
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
    await dataAccess.deleteUser(userId);
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Database initialized with SQLite');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  dataAccess.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  dataAccess.close();
  process.exit(0);
});
