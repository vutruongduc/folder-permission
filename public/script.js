// Global variables
let teams = [];
let users = [];
let deleteItem = null;

// Bootstrap components
let teamModal, userModal, deleteModal, toast;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeModals();
    loadData();
    setupEventListeners();
});

// Initialize Bootstrap modals
function initializeModals() {
    teamModal = new bootstrap.Modal(document.getElementById('teamModal'));
    userModal = new bootstrap.Modal(document.getElementById('userModal'));
    deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    toast = new bootstrap.Toast(document.getElementById('toast'));
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    document.getElementById('teamSearch').addEventListener('input', filterTeams);
    document.getElementById('userSearch').addEventListener('input', filterUsers);
    
    // Tab change events
    document.getElementById('teams-tab').addEventListener('click', () => {
        setTimeout(renderTeamsTable, 100);
    });
    
    document.getElementById('users-tab').addEventListener('click', () => {
        setTimeout(renderUsersTable, 100);
    });
}

// Load initial data
async function loadData() {
    try {
        await Promise.all([
            fetchTeams(),
            fetchUsers()
        ]);
        renderTeamsTable();
        renderUsersTable();
        populateTeamSelect();
    } catch (error) {
        showToast('Error loading data', 'Failed to load initial data', 'danger');
    }
}

// API Functions
async function fetchTeams() {
    const response = await fetch('/api/teams');
    if (!response.ok) throw new Error('Failed to fetch teams');
    teams = await response.json();
}

async function fetchUsers() {
    const response = await fetch('/api/users');
    if (!response.ok) throw new Error('Failed to fetch users');
    users = await response.json();
}

// Team Functions
function showTeamModal(team = null) {
    const modal = document.getElementById('teamModal');
    const title = document.getElementById('teamModalTitle');
    const form = document.getElementById('teamForm');
    const idField = document.getElementById('teamId');
    const nameField = document.getElementById('teamName');
    const foldersField = document.getElementById('teamFolders');
    
    if (team) {
        // Edit mode
        title.textContent = 'Edit Team';
        idField.value = team.id;
        nameField.value = team.name;
        foldersField.value = team.folders.join('\n');
    } else {
        // Add mode
        title.textContent = 'Add Team';
        form.reset();
        idField.value = '';
    }
    
    teamModal.show();
}

async function saveTeam() {
    const id = document.getElementById('teamId').value;
    const name = document.getElementById('teamName').value.trim();
    const foldersText = document.getElementById('teamFolders').value.trim();
    
    if (!name || !foldersText) {
        showToast('Validation Error', 'Please fill in all required fields', 'warning');
        return;
    }
    
    const folders = foldersText.split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0)
        .map(f => f.startsWith('/') ? f : '/' + f);
    
    if (folders.length === 0) {
        showToast('Validation Error', 'Please enter at least one folder', 'warning');
        return;
    }
    
    try {
        const url = id ? `/api/teams/${id}` : '/api/teams';
        const method = id ? 'PUT' : 'POST';
        const body = { name, folders };
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save team');
        }
        
        const savedTeam = await response.json();
        
        if (id) {
            // Update existing team
            const index = teams.findIndex(t => t.id === parseInt(id));
            if (index !== -1) {
                teams[index] = savedTeam;
            }
        } else {
            // Add new team
            teams.push(savedTeam);
        }
        
        teamModal.hide();
        renderTeamsTable();
        populateTeamSelect();
        showToast('Success', `Team "${name}" ${id ? 'updated' : 'created'} successfully`, 'success');
        
    } catch (error) {
        showToast('Error', error.message, 'danger');
    }
}

async function deleteTeam(teamId) {
    try {
        const response = await fetch(`/api/teams/${teamId}`, { method: 'DELETE' });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete team');
        }
        
        teams = teams.filter(t => t.id !== teamId);
        renderTeamsTable();
        populateTeamSelect();
        showToast('Success', 'Team deleted successfully', 'success');
        
    } catch (error) {
        showToast('Error', error.message, 'danger');
    }
}

// User Functions
function showUserModal(user = null) {
    const modal = document.getElementById('userModal');
    const title = document.getElementById('userModalTitle');
    const form = document.getElementById('userForm');
    const idField = document.getElementById('userId');
    const nameField = document.getElementById('userName');
    const teamField = document.getElementById('userTeam');
    const foldersField = document.getElementById('userCustomFolders');
    
    if (user) {
        // Edit mode
        title.textContent = 'Edit User';
        idField.value = user.id;
        nameField.value = user.name;
        teamField.value = user.teamId;
        foldersField.value = user.customFolders ? user.customFolders.join('\n') : '';
    } else {
        // Add mode
        title.textContent = 'Add User';
        form.reset();
        idField.value = '';
    }
    
    userModal.show();
}

async function saveUser() {
    const id = document.getElementById('userId').value;
    const name = document.getElementById('userName').value.trim();
    const teamId = document.getElementById('userTeam').value;
    const foldersText = document.getElementById('userCustomFolders').value.trim();
    
    if (!name || !teamId) {
        showToast('Validation Error', 'Please fill in all required fields', 'warning');
        return;
    }
    
    let customFolders = null;
    if (foldersText) {
        customFolders = foldersText.split('\n')
            .map(f => f.trim())
            .filter(f => f.length > 0)
            .map(f => f.startsWith('/') ? f : '/' + f);
        
        if (customFolders.length === 0) {
            customFolders = null;
        }
    }
    
    try {
        const url = id ? `/api/users/${id}` : '/api/users';
        const method = id ? 'PUT' : 'POST';
        const body = { name, teamId: parseInt(teamId), customFolders };
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save user');
        }
        
        const savedUser = await response.json();
        
        if (id) {
            // Update existing user
            const index = users.findIndex(u => u.id === parseInt(id));
            if (index !== -1) {
                users[index] = savedUser;
            }
        } else {
            // Add new user
            users.push(savedUser);
        }
        
        userModal.hide();
        renderUsersTable();
        showToast('Success', `User "${name}" ${id ? 'updated' : 'created'} successfully`, 'success');
        
    } catch (error) {
        showToast('Error', error.message, 'danger');
    }
}

async function deleteUser(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete user');
        }
        
        users = users.filter(u => u.id !== userId);
        renderUsersTable();
        showToast('Success', 'User deleted successfully', 'success');
        
    } catch (error) {
        showToast('Error', error.message, 'danger');
    }
}

// Delete confirmation
function showDeleteModal(type, id, name) {
    deleteItem = { type, id, name };
    const message = document.getElementById('deleteMessage');
    message.textContent = `Are you sure you want to delete ${type.toLowerCase()} "${name}"?`;
    deleteModal.show();
}

async function confirmDelete() {
    if (!deleteItem) return;
    
    try {
        if (deleteItem.type === 'Team') {
            await deleteTeam(deleteItem.id);
        } else if (deleteItem.type === 'User') {
            await deleteUser(deleteItem.id);
        }
        
        deleteModal.hide();
        deleteItem = null;
        
    } catch (error) {
        // Error already handled in delete functions
    }
}

// Rendering Functions
function renderTeamsTable() {
    const tbody = document.getElementById('teamsTableBody');
    tbody.innerHTML = '';
    
    teams.forEach(team => {
        // Defensive programming: ensure all required properties exist
        const safeTeam = {
            id: team.id || 'N/A',
            name: team.name || 'Unknown',
            folders: Array.isArray(team.folders) ? team.folders : []
        };
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${safeTeam.id}</td>
            <td><strong>${escapeHtml(safeTeam.name)}</strong></td>
            <td>
                <div class="folder-list">
                    ${safeTeam.folders.length > 0 ? 
                        safeTeam.folders.map(folder => 
                            `<span class="folder-badge team-default">${escapeHtml(folder)}</span>`
                        ).join('') : 
                        '<em class="text-muted">No folders</em>'
                    }
                </div>
            </td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-warning" onclick="showTeamModal(${JSON.stringify(team).replace(/"/g, '&quot;')})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-danger" onclick="showDeleteModal('Team', ${team.id}, '${escapeHtml(team.name)}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    users.forEach(user => {
        // Defensive programming: ensure all required properties exist
        const safeUser = {
            id: user.id || 'N/A',
            name: user.name || 'Unknown',
            teamName: user.teamName || 'Unknown',
            customFolders: user.customFolders || null,
            effectiveFolders: user.effectiveFolders || [],
            isUsingTeamDefault: user.isUsingTeamDefault !== undefined ? user.isUsingTeamDefault : true
        };
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${safeUser.id}</td>
            <td><strong>${escapeHtml(safeUser.name)}</strong></td>
            <td>${escapeHtml(safeUser.teamName)}</td>
            <td>
                ${safeUser.customFolders && safeUser.customFolders.length > 0 ? 
                    `<div class="folder-list">
                        ${safeUser.customFolders.map(folder => 
                            `<span class="folder-badge custom">${escapeHtml(folder)}</span>`
                        ).join('')}
                    </div>` : 
                    '<em class="text-muted">Using team default</em>'
                }
            </td>
            <td>
                <div class="folder-list">
                    ${Array.isArray(safeUser.effectiveFolders) && safeUser.effectiveFolders.length > 0 ? 
                        safeUser.effectiveFolders.map(folder => 
                            `<span class="folder-badge ${safeUser.customFolders ? 'custom' : 'team-default'}">${escapeHtml(folder)}</span>`
                        ).join('') : 
                        '<em class="text-muted">No folders</em>'
                    }
                </div>
            </td>
            <td>
                <span class="status-indicator ${safeUser.isUsingTeamDefault ? 'status-team-default' : 'status-custom'}">
                    <i class="bi ${safeUser.isUsingTeamDefault ? 'bi-people-fill' : 'bi-person-fill'}"></i>
                    ${safeUser.isUsingTeamDefault ? 'Team Default' : 'Custom'}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-warning" onclick="showUserModal(${JSON.stringify(user).replace(/"/g, '&quot;')})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-danger" onclick="showDeleteModal('User', ${user.id}, '${escapeHtml(user.name)}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function populateTeamSelect() {
    const select = document.getElementById('userTeam');
    select.innerHTML = '<option value="">Select a team...</option>';
    
    teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team.id;
        option.textContent = team.name;
        select.appendChild(option);
    });
}

// Search and Filter Functions
function filterTeams() {
    const searchTerm = document.getElementById('teamSearch').value.toLowerCase();
    const tbody = document.getElementById('teamsTableBody');
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const teamName = row.cells[1].textContent.toLowerCase();
        const folders = row.cells[2].textContent.toLowerCase();
        
        if (teamName.includes(searchTerm) || folders.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function filterUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    const tbody = document.getElementById('usersTableBody');
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const userName = row.cells[1].textContent.toLowerCase();
        const teamName = row.cells[2].textContent.toLowerCase();
        const customFolders = row.cells[3].textContent.toLowerCase();
        const effectiveFolders = row.cells[4].textContent.toLowerCase();
        
        if (userName.includes(searchTerm) || teamName.includes(searchTerm) || 
            customFolders.includes(searchTerm) || effectiveFolders.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(title, message, type = 'info') {
    const toastTitle = document.getElementById('toastTitle');
    const toastBody = document.getElementById('toastBody');
    const toastElement = document.getElementById('toast');
    
    toastTitle.textContent = title;
    toastBody.textContent = message;
    
    // Update toast classes based on type
    toastElement.className = `toast ${type === 'danger' ? 'border-danger' : type === 'warning' ? 'border-warning' : type === 'success' ? 'border-success' : 'border-info'}`;
    
    toast.show();
}
