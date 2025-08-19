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
        
        // Debug logging
        console.log('Fetched users:', users.length);
        console.log('Sample user:', users[0]);
        console.log('Users with team_id:', users.filter(u => u.team_id).length);
        console.log('Users with team_id = 4:', users.filter(u => u.team_id === 4).length);
        
        renderUsersTable();
        // Re-render teams table to update member counts now that users are loaded
        renderTeamsTable();
    } catch (error) {
        console.error('Error fetching users:', error);
        users = [];
        renderUsersTable();
        renderTeamsTable();
    }
}

// Rendering functions
function renderTeamsTable(teamsToRender = teams) {
    const tbody = document.getElementById('teamsTableBody');
    tbody.innerHTML = '';
    
    teamsToRender.forEach(team => {
        // Count team members using the correct field name
        const teamMembers = users.filter(user => user.team_id === team.id);
        const membersWithCustomFolders = teamMembers.filter(user => user.custom_folders && user.custom_folders.length > 0);
        const membersInheritingDefault = teamMembers.filter(user => user.is_using_team_default);
        
        // Debug logging
        console.log(`Team ${team.name} (ID: ${team.id}): ${teamMembers.length} members`);
        console.log('Team members:', teamMembers.map(u => ({ id: u.id, name: u.name, team_id: u.team_id })));
        
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
            <td>${user.team_name || 'No Team'}</td>
            <td>${renderFolderBadges(user.custom_folders || [], 'custom')}</td>
            <td>${renderFolderBadges(user.effective_folders || [], user.is_using_team_default ? 'team' : 'custom')}</td>
            <td>${user.is_using_team_default ? 
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
    
    if (!name || !folders.length) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        let response;
        let newTeam;
        
        if (teamId) {
            // Update existing team
            response = await fetch(`/api/teams/${teamId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, folders })
            });
            newTeam = await response.json();
        } else {
            // Create new team
            response = await fetch('/api/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, folders })
            });
            newTeam = await response.json();
            
            // If creating new team, check if we need to add users
            if (newTeam && newTeam.id) {
                await addUsersToTeam(newTeam.id, formData);
            }
        }
        
        if (!response.ok) throw new Error('Failed to save team');
        
        await Promise.all([fetchTeams(), fetchUsers()]);
        bootstrap.Modal.getInstance(document.getElementById('teamModal')).hide();
        form.reset();
        document.getElementById('teamModalTitle').textContent = 'Add Team';
        hideAddUsersSection(); // Hide the users section after saving
    } catch (error) {
        console.error('Error saving team:', error);
        alert('Failed to save team');
    }
}

// Function to toggle the add users section visibility
function toggleAddUsersSection() {
    const section = document.getElementById('addUsersSection');
    const button = event.target.closest('button');
    const icon = button.querySelector('i');
    
    if (section.style.display === 'none') {
        section.style.display = 'block';
        icon.className = 'bi bi-dash-circle';
        button.innerHTML = '<i class="bi bi-dash-circle"></i> Hide';
        // Reset selected users when opening
        selectedUsers = [];
        document.getElementById('selectedUserIds').value = '';
        document.getElementById('userSearchInput').value = '';
        document.getElementById('userSearchResults').style.display = 'none';
        document.getElementById('selectedUsersSection').style.display = 'none';
    } else {
        section.style.display = 'none';
        icon.className = 'bi bi-plus-circle';
        button.innerHTML = '<i class="bi bi-plus-circle"></i> Show';
    }
}

// Function to hide the add users section
function hideAddUsersSection() {
    const section = document.getElementById('addUsersSection');
    const button = document.querySelector('button[onclick="toggleAddUsersSection()"]');
    const icon = button.querySelector('i');
    
    section.style.display = 'none';
    icon.className = 'bi bi-plus-circle';
    button.innerHTML = '<i class="bi bi-plus-circle"></i> Show';
    
    // Reset selected users
    selectedUsers = [];
    document.getElementById('selectedUserIds').value = '';
}

// Global variables for user selection
let selectedUsers = [];

// Function to search users for team assignment
function searchUsersForTeam(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
        document.getElementById('userSearchResults').style.display = 'none';
        return;
    }
    
    const searchLower = searchTerm.toLowerCase();
    
    // Filter users based on search term
    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        (user.github_login && user.github_login.toLowerCase().includes(searchLower))
    );
    
    // Sort: users without teams first, then users with teams
    const sortedUsers = filteredUsers.sort((a, b) => {
        if (!a.teamId && b.teamId) return -1;
        if (a.teamId && !b.teamId) return 1;
        return a.name.localeCompare(b.name);
    });
    
    displayUserSearchResults(sortedUsers);
}

// Function to display user search results
function displayUserSearchResults(users) {
    const resultsDiv = document.getElementById('userSearchResults');
    const listDiv = document.getElementById('userSearchList');
    
    if (users.length === 0) {
        listDiv.innerHTML = '<p class="text-muted mb-0">No users found matching your search.</p>';
        resultsDiv.style.display = 'block';
        return;
    }
    
    listDiv.innerHTML = users.map(user => {
        const avatar = user.avatar_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjNmM3NTdkIi8+CjxwYXRoIGQ9Ik0xMCAxMEMxMi43NjEgMTAgMTUgNy43NjEgMTUgNUExMCA1IDEwIDVMMTAgMTBaIiBmaWxsPSIjZjhmOWZhIi8+CjxwYXRoIGQ9Ik0xNSAxNUMxNSAxMi4yMzkgMTIuNzYxIDEwIDEwIDEwUzUgMTIuMjM5IDUgMTVIMTVaIiBmaWxsPSIjZjhmOWZhIi8+Cjwvc3ZnPgo=';
        const isSelected = selectedUsers.some(selected => selected.id === user.id);
        const isAlreadyInTeam = user.team_id;
        
        return `
            <div class="d-flex align-items-center justify-content-between p-2 border-bottom ${isSelected ? 'bg-light' : ''}" style="cursor: pointer;" onclick="toggleUserSelection(${user.id})">
                <div class="d-flex align-items-center">
                    <img src="${avatar}" alt="${user.name}" style="width: 32px; height: 32px; border-radius: 50%; margin-right: 12px;">
                    <div>
                        <div class="fw-bold">${user.name}</div>
                        <small class="text-muted">@${user.github_login}</small>
                    </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                    ${isAlreadyInTeam ? `<span class="badge bg-secondary">${user.team_name}</span>` : '<span class="badge bg-success">No Team</span>'}
                    ${isSelected ? '<i class="bi bi-check-circle-fill text-success"></i>' : '<i class="bi bi-plus-circle text-primary"></i>'}
                </div>
            </div>
        `;
    }).join('');
    
    resultsDiv.style.display = 'block';
}

// Function to toggle user selection
function toggleUserSelection(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const existingIndex = selectedUsers.findIndex(selected => selected.id === userId);
    
    if (existingIndex !== -1) {
        // Remove user from selection
        selectedUsers.splice(existingIndex, 1);
    } else {
        // Add user to selection
        selectedUsers.push({
            id: user.id,
            name: user.name,
            teamId: user.team_id,
            customFolders: user.custom_folders || []
        });
    }
    
    // Update hidden input with selected user IDs
    document.getElementById('selectedUserIds').value = selectedUsers.map(u => u.id).join(',');
    
    // Refresh displays
    displayUserSearchResults(document.getElementById('userSearchInput').value ? 
        users.filter(u => u.name.toLowerCase().includes(document.getElementById('userSearchInput').value.toLowerCase())) : 
        []
    );
    displaySelectedUsers();
}

// Function to display selected users
function displaySelectedUsers() {
    const section = document.getElementById('selectedUsersSection');
    const list = document.getElementById('selectedUsersList');
    
    if (selectedUsers.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    list.innerHTML = selectedUsers.map(user => {
        const avatar = user.avatar_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjNmM3NTdkIi8+CjxwYXRoIGQ9Ik0xMCAxMEMxMi43NjEgMTAgMTUgNy43NjEgMTUgNUExMCA1IDEwIDVMMTAgMTBaIiBmaWxsPSIjZjhmOWZhIi8+CjxwYXRoIGQ9Ik0xNSAxNUMxNSAxMi4yMzkgMTIuNzYxIDEwIDEwIDEwUzUgMTIuMjM5IDUgMTVIMTVaIiBmaWxsPSIjZjhmOWZhIi8+Cjwvc3ZnPgo=';
        
        return `
            <div class="d-flex align-items-center justify-content-between p-2 border-bottom">
                <div class="d-flex align-items-center">
                    <img src="${avatar}" alt="${user.name}" style="width: 32px; height: 32px; border-radius: 50%; margin-right: 12px;">
                    <div>
                        <div class="fw-bold">${user.name}</div>
                        <small class="text-muted">@${user.github_login}</small>
                    </div>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="removeSelectedUser(${user.id})">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `;
    }).join('');
    
    section.style.display = 'block';
}

// Function to remove a selected user
function removeSelectedUser(userId) {
    selectedUsers = selectedUsers.filter(user => user.id !== userId);
    document.getElementById('selectedUserIds').value = selectedUsers.map(u => u.id).join(',');
    displaySelectedUsers();
    
    // Refresh search results if search is active
    const searchTerm = document.getElementById('userSearchInput').value;
    if (searchTerm) {
        searchUsersForTeam(searchTerm);
    }
}

// Function to clear user search
function clearUserSearch() {
    document.getElementById('userSearchInput').value = '';
    document.getElementById('userSearchResults').style.display = 'none';
}

// Function to add users to a newly created team
async function addUsersToTeam(teamId, formData) {
    if (selectedUsers.length === 0) return; // No users to add
    
    // Update each selected user to assign them to the team
    for (const user of selectedUsers) {
        try {
            const response = await fetch(`/api/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: user.name,
                    teamId: teamId,
                    customFolders: user.custom_folders
                })
            });
            
            if (!response.ok) {
                console.error(`Failed to update user ${user.name}:`, await response.text());
            }
        } catch (error) {
            console.error(`Error updating user ${user.name}:`, error);
        }
    }
    
    console.log(`Successfully added ${selectedUsers.length} users to team ${teamId}`);
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
    
    // Use the same modal for editing
    document.getElementById('teamModalTitle').textContent = 'Edit Team';
    document.getElementById('teamId').value = team.id;
    document.getElementById('teamName').value = team.name;
    document.getElementById('teamFolders').value = team.folders.join('\n');
    
    new bootstrap.Modal(document.getElementById('teamModal')).show();
}

function showTeamDetails(teamId) {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    
    // Get team members using the correct field names
    const teamMembers = users.filter(user => user.team_id === teamId);
    const membersWithCustomFolders = teamMembers.filter(user => user.custom_folders && user.custom_folders.length > 0);
    const membersWithBothFolders = teamMembers.filter(user => user.custom_folders && user.custom_folders.length > 0 && user.team_id);
    const membersWithOnlyTeamFolders = teamMembers.filter(user => (!user.custom_folders || user.custom_folders.length === 0) && user.team_id);
    
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
    document.getElementById('teamBothFoldersCount').textContent = membersWithBothFolders.length;
    document.getElementById('teamTeamFoldersCount').textContent = membersWithOnlyTeamFolders.length;
    
    // Update members list
    const membersList = document.getElementById('teamMembersList');
    if (teamMembers.length > 0) {
        membersList.innerHTML = teamMembers.map(user => `
            <div class="d-flex align-items-center mb-2 p-2 border rounded">
                <img src="${user.avatar_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjNmM3NTdkIi8+CjxwYXRoIGQ9Ik0yMCAyMGM1LjUyMyAwIDEwLTQuNDc3IDEwLTEwUzI1LjUyMyAwIDIwIDBTMTAgNC40NzcgMTAgMTBTMTQuNDc3IDIwIDIwIDIwWiIgZmlsbD0iI2Y4ZjlmYSIvPgo8cGF0aCBkPSJNMzAgMzBjMCA1LjUyMy00LjQ3NyAxMC0xMCAxMFMxMCAzNS41MjMgMTAgMzBIMzBaIiBmaWxsPSIjZjhmOWZhIi8+Cjwvc3ZnPgo='}" 
                     alt="${user.name}" class="avatar me-2" style="width: 32px; height: 32px;">
                <div class="flex-grow-1">
                    <div class="fw-bold">${user.name}</div>
                    <small class="text-muted">
                        ${user.custom_folders && user.custom_folders.length > 0 
                            ? user.team_id 
                                ? `<span class="badge bg-info">Custom + Team folders (${user.custom_folders.length} + ${user.effective_folders.length - user.custom_folders.length})</span>`
                                : `<span class="badge bg-warning">Custom folders (${user.custom_folders.length})</span>`
                            : user.team_id 
                                ? '<span class="badge bg-success">Team folders only</span>'
                                : '<span class="badge bg-secondary">No folders</span>'
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
    
    // Use the same modal for editing
    document.getElementById('userModalTitle').textContent = 'Edit User';
    document.getElementById('userId').value = user.id;
    document.getElementById('userName').value = user.name;
            document.getElementById('userCustomFolders').value = (user.custom_folders || []).join('\n');
    
    // Populate team dropdown FIRST
    const teamSelect = document.getElementById('userTeam');
    teamSelect.innerHTML = '<option value="">No Team</option>';
    teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team.id;
        option.textContent = team.name;
        teamSelect.appendChild(option);
    });
    
    // THEN set the selected value AFTER dropdown is populated
            document.getElementById('userTeam').value = user.team_id || '';
    
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
                (user.team_name && user.team_name.toLowerCase().includes(searchTerm))
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
document.addEventListener('DOMContentLoaded', async function() {
    initializeModals();
    setupEventListeners();
    initializeTheme();
    
    // Load data in parallel and ensure teams table is re-rendered after users are loaded
    await Promise.all([fetchTeams(), fetchUsers()]);
});