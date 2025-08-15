// Global state
let teams = [];
let users = [];

// Theme management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    icon.className = theme === 'light' ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
}

// Utility functions
function renderFolderBadges(folders, type) {
    if (!folders || !folders.length) return '<span class="text-muted">No folders</span>';
    return folders.map(folder => 
        `<span class="badge folder-badge ${type}-folder">${folder}</span>`
    ).join(' ');
}

// API calls
async function fetchTeams() {
    try {
        const response = await fetch('/api/teams');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        teams = Array.isArray(data) ? data : [];
        renderTeamsTable();
    } catch (error) {
        console.error('Error fetching teams:', error);
        teams = [];
        renderTeamsTable();
    }
}

async function fetchUsers() {
    try {
        const response = await fetch('/api/users');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        users = Array.isArray(data) ? data : [];
        renderUsersTable();
    } catch (error) {
        console.error('Error fetching users:', error);
        users = [];
        renderUsersTable();
    }
}

// Rendering functions
function renderTeamsTable(teamsToRender = teams) {
    const tbody = document.getElementById('teamsTableBody');
    tbody.innerHTML = '';
    
    teamsToRender.forEach(team => {
        // Count team members
        const teamMembers = users.filter(user => user.teamId === team.id);
        const membersWithCustomFolders = teamMembers.filter(user => user.customFolders && user.customFolders.length > 0);
        const membersInheritingDefault = teamMembers.filter(user => user.isUsingTeamDefault);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${team.id}</td>
            <td>${team.name}</td>
            <td>${renderFolderBadges(team.folders || [], 'team')}</td>
            <td>
                <span class="badge bg-info">${teamMembers.length} members</span>
                ${membersWithCustomFolders.length > 0 ? `<span class="badge bg-warning ms-1">${membersWithCustomFolders.length} custom</span>` : ''}
            </td>
            <td>
                <button class="btn btn-sm btn-info" onclick="showTeamDetails(${team.id})" title="View Details">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-primary" onclick="editTeam(${team.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="showDeleteModal('team', ${team.id}, '${team.name}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>`;
        tbody.appendChild(row);
    });
}

function renderUsersTable(usersToRender = users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    usersToRender.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>
                ${user.avatar_url ? 
                    `<img src="${user.avatar_url}" alt="${user.name}" class="avatar rounded-circle" width="40" height="40">` :
                    '<div class="avatar-placeholder rounded-circle">No Avatar</div>'
                }
            </td>
            <td>
                ${user.github_url ? 
                    `<a href="${user.github_url}" target="_blank" class="github-link">
                        ${user.name} <i class="bi bi-box-arrow-up-right"></i>
                    </a>` :
                    user.name
                }
            </td>
            <td>${user.teamName || 'No Team'}</td>
            <td>${renderFolderBadges(user.customFolders || [], 'custom')}</td>
            <td>${renderFolderBadges(user.effectiveFolders || [], user.isUsingTeamDefault ? 'team' : 'custom')}</td>
            <td>${user.isUsingTeamDefault ? 
                '<span class="badge bg-info">Using Team Default</span>' : 
                '<span class="badge bg-warning">Custom Config</span>'
            }</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editUser(${user.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="showDeleteModal('user', ${user.id}, '${user.name}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>`;
        tbody.appendChild(row);
    });
}

// Modal functions
function showTeamModal() {
    document.getElementById('teamModalTitle').textContent = 'Add Team';
    document.getElementById('teamId').value = '';
    document.getElementById('teamName').value = '';
    document.getElementById('teamFolders').value = '';
    new bootstrap.Modal(document.getElementById('teamModal')).show();
}

function showUserModal() {
    document.getElementById('userModalTitle').textContent = 'Add User';
    document.getElementById('userId').value = '';
    document.getElementById('userName').value = '';
    document.getElementById('userTeam').value = ''; // This will default to "No Team"
    document.getElementById('userCustomFolders').value = '';
    
    // Populate team dropdown
    const teamSelect = document.getElementById('userTeam');
    teamSelect.innerHTML = '<option value="">No Team</option>';
    teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team.id;
        option.textContent = team.name;
        teamSelect.appendChild(option);
    });
    
    new bootstrap.Modal(document.getElementById('userModal')).show();
}

// CRUD operations
async function createTeam(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const name = formData.get('teamName');
    const folders = formData.get('teamFolders').split('\n').map(f => f.trim()).filter(f => f);
    
    try {
        const response = await fetch('/api/teams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, folders })
        });
        
        if (!response.ok) throw new Error('Failed to create team');
        
        await fetchTeams();
        bootstrap.Modal.getInstance(document.getElementById('addTeamModal')).hide();
        form.reset();
    } catch (error) {
        console.error('Error creating team:', error);
        alert('Failed to create team');
    }
}

async function saveTeam() {
    const form = document.getElementById('teamForm');
    const formData = new FormData(form);
    
    const teamId = formData.get('teamId');
    const name = formData.get('teamName');
    const folders = formData.get('teamFolders').split('\n').map(f => f.trim()).filter(f => f);
    
    // Debug logging
    console.log('saveTeam called with:', { teamId, name, folders });
    console.log('Form data entries:');
    for (let [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
    }
    
    if (!name || !folders.length) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        let response;
        if (teamId) {
            console.log(`Updating existing team with ID: ${teamId}`);
            // Update existing team
            response = await fetch(`/api/teams/${teamId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, folders })
            });
        } else {
            console.log('Creating new team (no teamId found)');
            // Create new team
            response = await fetch('/api/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, folders })
            });
        }
        
        if (!response.ok) throw new Error('Failed to save team');
        
        await fetchTeams();
        bootstrap.Modal.getInstance(document.getElementById('teamModal')).hide();
        form.reset();
        document.getElementById('teamModalTitle').textContent = 'Add Team';
    } catch (error) {
        console.error('Error saving team:', error);
        alert('Failed to save team');
    }
}

async function createUser(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const name = formData.get('userName');
    const teamId = parseInt(formData.get('userTeam'));
    const customFolders = formData.get('userCustomFolders').split('\n').map(f => f.trim()).filter(f => f);
    
    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, teamId, customFolders })
        });
        
        if (!response.ok) throw new Error('Failed to create user');
        
        await fetchUsers();
        bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
        form.reset();
    } catch (error) {
        console.error('Error creating user:', error);
        alert('Failed to create user');
    }
}

async function saveUser() {
    const form = document.getElementById('userForm');
    const formData = new FormData(form);
    
    const userId = formData.get('userId');
    const name = formData.get('userName');
    const teamIdValue = formData.get('userTeam');
    const teamId = teamIdValue ? parseInt(teamIdValue) : null;
    const customFolders = formData.get('userCustomFolders').split('\n').map(f => f.trim()).filter(f => f);
    
    // Debug logging
    console.log('saveUser called with:', { userId, name, teamId, customFolders });
    console.log('Form data entries:');
    for (let [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
    }
    
    // Additional debugging
    console.log('userId field element:', document.getElementById('userId'));
    console.log('userId field value:', document.getElementById('userId').value);
    console.log('userId field type:', document.getElementById('userId').type);
    
    if (!name) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        let response;
        if (userId) {
            // Update existing user
            response = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, teamId, customFolders })
            });
        } else {
            // Create new user
            response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, teamId, customFolders })
            });
        }
        
        if (!response.ok) throw new Error('Failed to save user');
        
        await fetchUsers();
        bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();
        form.reset();
        document.getElementById('userModalTitle').textContent = 'Add User';
    } catch (error) {
        console.error('Error saving user:', error);
        alert('Failed to save user');
    }
}

async function editTeam(id) {
    const team = teams.find(t => t.id === id);
    if (!team) return;
    
    console.log('editTeam called with:', { id, team });
    
    // Use the same modal for editing
    document.getElementById('teamModalTitle').textContent = 'Edit Team';
    document.getElementById('teamId').value = team.id;
    document.getElementById('teamName').value = team.name;
    document.getElementById('teamFolders').value = team.folders.join('\n');
    
    // Debug: Check if teamId was set
    console.log('teamId field value after setting:', document.getElementById('teamId').value);
    
    new bootstrap.Modal(document.getElementById('teamModal')).show();
}

function showTeamDetails(teamId) {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    
    // Get team members
    const teamMembers = users.filter(user => user.teamId === teamId);
    const membersWithCustomFolders = teamMembers.filter(user => user.customFolders && user.customFolders.length > 0);
    const membersInheritingDefault = teamMembers.filter(user => user.isUsingTeamDefault);
    
    // Update modal title
    document.getElementById('teamDetailsTitle').textContent = `Team Details: ${team.name}`;
    
    // Update folders list
    const foldersList = document.getElementById('teamFoldersList');
    if (team.folders && team.folders.length > 0) {
        foldersList.innerHTML = team.folders.map(folder => 
            `<span class="badge bg-secondary me-1 mb-1">${folder}</span>`
        ).join('');
    } else {
        foldersList.innerHTML = '<span class="text-muted">No default folders</span>';
    }
    
    // Update statistics
    document.getElementById('teamMemberCount').textContent = teamMembers.length;
    document.getElementById('teamCustomFoldersCount').textContent = membersWithCustomFolders.length;
    document.getElementById('teamInheritingCount').textContent = membersInheritingDefault.length;
    
    // Update members list
    const membersList = document.getElementById('teamMembersList');
    if (teamMembers.length > 0) {
        membersList.innerHTML = teamMembers.map(user => `
            <div class="d-flex align-items-center mb-2 p-2 border rounded">
                <img src="${user.avatarUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjNmM3NTdkIi8+CjxwYXRoIGQ9Ik0yMCAyMGM1LjUyMyAwIDEwLTQuNDc3IDEwLTEwUzI1LjUyMyAwIDIwIDBTMTAgNC40NzcgMTAgMTBTMTQuNDc3IDIwIDIwIDIwWiIgZmlsbD0iI2Y4ZjlmYSIvPgo8cGF0aCBkPSJNMzAgMzBjMCA1LjUyMy00LjQ3NyAxMC0xMCAxMFMxMCAzNS41MjMgMTAgMzBIMzBaIiBmaWxsPSIjZjhmOWZhIi8+Cjwvc3ZnPgo='}" 
                     alt="${user.name}" class="avatar me-2" style="width: 32px; height: 32px;">
                <div class="flex-grow-1">
                    <div class="fw-bold">${user.name}</div>
                    <small class="text-muted">
                        ${user.customFolders && user.customFolders.length > 0 
                            ? `<span class="badge bg-warning">Custom folders (${user.customFolders.length})</span>`
                            : '<span class="badge bg-success">Inheriting default</span>'
                        }
                    </small>
                </div>
            </div>
        `).join('');
    } else {
        membersList.innerHTML = '<span class="text-muted">No team members</span>';
    }
    
    // Store team ID for edit function
    document.getElementById('teamDetailsModal').setAttribute('data-team-id', teamId);
    
    // Show modal
    new bootstrap.Modal(document.getElementById('teamDetailsModal')).show();
}

function editTeamFromDetails() {
    const teamId = document.getElementById('teamDetailsModal').getAttribute('data-team-id');
    if (teamId) {
        // Close details modal
        bootstrap.Modal.getInstance(document.getElementById('teamDetailsModal')).hide();
        // Open edit modal
        editTeam(parseInt(teamId));
    }
}

async function updateTeam(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const id = parseInt(formData.get('id'));
    const name = formData.get('name');
    const folders = formData.get('folders').split('\n').map(f => f.trim()).filter(f => f);
    
    try {
        const response = await fetch(`/api/teams/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, folders })
        });
        
        if (!response.ok) throw new Error('Failed to update team');
        
        await Promise.all([fetchTeams(), fetchUsers()]);
        bootstrap.Modal.getInstance(document.getElementById('editTeamModal')).hide();
    } catch (error) {
        console.error('Error updating team:', error);
        alert('Failed to update team');
    }
}

async function editUser(id) {
    const user = users.find(u => u.id === id);
    if (!user) return;
    
    console.log('editUser called with:', { id, user });
    
    // Use the same modal for editing
    document.getElementById('userModalTitle').textContent = 'Edit User';
    document.getElementById('userId').value = user.id;
    document.getElementById('userName').value = user.name;
    document.getElementById('userTeam').value = user.teamId || '';
    document.getElementById('userCustomFolders').value = (user.customFolders || []).join('\n');
    
    // Debug: Check if userId was set
    console.log('userId field value after setting:', document.getElementById('userId').value);
    console.log('userId field element after setting:', document.getElementById('userId'));
    
    // Populate team dropdown
    const teamSelect = document.getElementById('userTeam');
    teamSelect.innerHTML = '<option value="">No Team</option>';
    teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team.id;
        option.textContent = team.name;
        teamSelect.appendChild(option);
    });
    
    new bootstrap.Modal(document.getElementById('userModal')).show();
}

async function updateUser(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const id = parseInt(formData.get('id'));
    const name = formData.get('name');
    const teamId = parseInt(formData.get('teamId'));
    const customFolders = formData.get('customFolders').split('\n').map(f => f.trim()).filter(f => f);
    
    try {
        const response = await fetch(`/api/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, teamId, customFolders })
        });
        
        if (!response.ok) throw new Error('Failed to update user');
        
        await fetchUsers();
        bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
    } catch (error) {
        console.error('Error updating user:', error);
        alert('Failed to update user');
    }
}

async function deleteTeam(id) {
    if (!confirm('Are you sure you want to delete this team?')) return;
    
    try {
        const response = await fetch(`/api/teams/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete team');
        
        await Promise.all([fetchTeams(), fetchUsers()]);
    } catch (error) {
        console.error('Error deleting team:', error);
        alert('Failed to delete team');
    }
}

async function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
        const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete user');
        
        await fetchUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
    }
}

// Global variables for delete operations
let deleteType = '';
let deleteId = null;

function confirmDelete() {
    if (deleteType === 'team') {
        deleteTeam(deleteId);
    } else if (deleteType === 'user') {
        deleteUser(deleteId);
    }
    
    // Reset and close modal
    deleteType = '';
    deleteId = null;
    bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
}

function showDeleteModal(type, id, name) {
    deleteType = type;
    deleteId = id;
    
    const message = document.getElementById('deleteMessage');
    message.textContent = `Are you sure you want to delete ${type} "${name}"?`;
    
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
}

// Event listeners and initialization
function setupEventListeners() {
    // Forms are handled by onclick handlers in HTML
    
    // Add search functionality
    const teamSearch = document.getElementById('teamSearch');
    const userSearch = document.getElementById('userSearch');
    
    if (teamSearch) {
        teamSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const filteredTeams = teams.filter(team => 
                team.name.toLowerCase().includes(searchTerm)
            );
            renderTeamsTable(filteredTeams);
        });
    }
    
    if (userSearch) {
        userSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const filteredUsers = users.filter(user => 
                user.name.toLowerCase().includes(searchTerm) ||
                (user.teamName && user.teamName.toLowerCase().includes(searchTerm))
            );
            renderUsersTable(filteredUsers);
        });
    }
}

function initializeModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('hidden.bs.modal', event => {
            event.target.querySelector('form')?.reset();
        });
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeModals();
    setupEventListeners();
    fetchTeams();
    fetchUsers();
    initializeTheme();
});