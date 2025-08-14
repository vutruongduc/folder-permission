const fs = require('fs');
const path = require('path');

class Storage {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.teamsFile = path.join(this.dataDir, 'teams.json');
        this.usersFile = path.join(this.dataDir, 'users.json');
        this.init();
    }

    init() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
        this.initializeFiles();
        console.log('Storage initialized with JSON files');
    }

    initializeFiles() {
        if (!fs.existsSync(this.teamsFile)) {
            const initialTeams = [
                { id: 1, name: "Dev", folders: ["/Code", "/Docs"], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: 2, name: "Design", folders: ["/Art", "/UI", "/UX"], created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
            ];
            fs.writeFileSync(this.teamsFile, JSON.stringify(initialTeams, null, 2));
        }

        if (!fs.existsSync(this.usersFile)) {
            const initialUsers = [
                { id: 1, name: "Alice", team_id: 1, custom_folders: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: 2, name: "Bob", team_id: 1, custom_folders: ["/Code", "/Docs", "/Tests"], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: 3, name: "Carol", team_id: 2, custom_folders: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
            ];
            fs.writeFileSync(this.usersFile, JSON.stringify(initialUsers, null, 2));
        }
    }

    readFile(filePath) {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error reading file ${filePath}:`, error);
            return [];
        }
    }

    writeFile(filePath, data) {
        try {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error(`Error writing file ${filePath}:`, error);
            return false;
        }
    }

    getNextId(collection) {
        if (collection.length === 0) return 1;
        return Math.max(...collection.map(item => item.id)) + 1;
    }

    // Team operations
    getAllTeams() {
        const teams = this.readFile(this.teamsFile);
        return teams.map(team => ({
            ...team,
            teamId: team.id,
            folders: team.folders || []
        }));
    }

    getTeamById(teamId) {
        const teams = this.readFile(this.teamsFile);
        const team = teams.find(t => t.id === teamId);
        if (team) {
            return {
                ...team,
                teamId: team.id,
                folders: team.folders || []
            };
        }
        return null;
    }

    createTeam(name, folders) {
        const teams = this.readFile(this.teamsFile);
        const newTeam = {
            id: this.getNextId(teams),
            name,
            folders,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        teams.push(newTeam);
        this.writeFile(this.teamsFile, teams);
        
        return {
            ...newTeam,
            teamId: newTeam.id,
            folders: newTeam.folders
        };
    }

    updateTeam(teamId, name, folders) {
        const teams = this.readFile(this.teamsFile);
        const teamIndex = teams.findIndex(t => t.id === teamId);
        
        if (teamIndex === -1) {
            throw new Error('Team not found');
        }
        
        teams[teamIndex] = {
            ...teams[teamIndex],
            name,
            folders,
            updated_at: new Date().toISOString()
        };
        
        this.writeFile(this.teamsFile, teams);
        
        return {
            ...teams[teamIndex],
            teamId: teams[teamIndex].id,
            folders: teams[teamIndex].folders
        };
    }

    deleteTeam(teamId) {
        const teams = this.readFile(this.teamsFile);
        const users = this.readFile(this.usersFile);
        
        const usersInTeam = users.filter(u => u.team_id === teamId);
        if (usersInTeam.length > 0) {
            throw new Error('Cannot delete team with assigned users. Please reassign users first.');
        }
        
        const filteredTeams = teams.filter(t => t.id !== teamId);
        this.writeFile(this.teamsFile, filteredTeams);
        
        return true;
    }

    // User operations
    getAllUsers() {
        const users = this.readFile(this.usersFile);
        const teams = this.readFile(this.teamsFile);
        
        return users.map(user => {
            const team = teams.find(t => t.id === user.team_id);
            const teamName = team ? team.name : 'Unknown';
            const customFolders = user.custom_folders;
            const effectiveFolders = customFolders && customFolders.length > 0 
                ? customFolders 
                : (team ? team.folders : []);
            const isUsingTeamDefault = !customFolders || customFolders.length === 0;
            
            return {
                id: user.id,
                name: user.name,
                teamId: user.team_id,
                customFolders: customFolders,
                teamName,
                effectiveFolders,
                isUsingTeamDefault,
                created_at: user.created_at,
                updated_at: user.updated_at
            };
        });
    }

    getUserById(userId) {
        const users = this.readFile(this.usersFile);
        const teams = this.readFile(this.teamsFile);
        
        const user = users.find(u => u.id === userId);
        if (user) {
            const team = teams.find(t => t.id === user.team_id);
            const teamName = team ? team.name : 'Unknown';
            const customFolders = user.custom_folders;
            const effectiveFolders = customFolders && customFolders.length > 0 
                ? customFolders 
                : (team ? team.folders : []);
            const isUsingTeamDefault = !customFolders || customFolders.length === 0;
            
            return {
                id: user.id,
                name: user.name,
                teamId: user.team_id,
                customFolders: customFolders,
                teamName,
                effectiveFolders,
                isUsingTeamDefault,
                created_at: user.created_at,
                updated_at: user.updated_at
            };
        }
        return null;
    }

    createUser(name, teamId, customFolders) {
        const users = this.readFile(this.usersFile);
        const newUser = {
            id: this.getNextId(users),
            name,
            team_id: teamId,
            custom_folders: customFolders && customFolders.length > 0 ? customFolders : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        users.push(newUser);
        this.writeFile(this.usersFile, users);
        
        return this.getUserById(newUser.id);
    }

    updateUser(userId, name, teamId, customFolders) {
        const users = this.readFile(this.usersFile);
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            throw new Error('User not found');
        }
        
        users[userIndex] = {
            ...users[userIndex],
            name,
            team_id: teamId,
            custom_folders: customFolders && customFolders.length > 0 ? customFolders : null,
            updated_at: new Date().toISOString()
        };
        
        this.writeFile(this.usersFile, users);
        
        return this.getUserById(userId);
    }

    deleteUser(userId) {
        const users = this.readFile(this.usersFile);
        const filteredUsers = users.filter(u => u.id !== userId);
        this.writeFile(this.usersFile, filteredUsers);
        
        return true;
    }

    close() {
        console.log('Storage closed');
    }
}

module.exports = Storage;
