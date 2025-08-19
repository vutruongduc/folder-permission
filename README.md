# Folder Configuration Tool

A web-based tool for managing folder configurations for teams and individual users with inheritance rules. Built with Node.js/Express backend, PostgreSQL database, and modern HTML/CSS/JavaScript frontend.

## 🚀 What This Tool Does

This tool helps organizations manage folder access for teams and users with smart inheritance rules:

- **Teams** get assigned default folders (e.g., Dev team gets `/Code`, `/Docs`)
- **Users** automatically inherit their team's folders
- **Custom folders** can override team defaults for specific users
- **Real-time updates** when team folders change
- **GitHub Integration** for automatic user synchronization
- **Permission Checking** via command-line scripts

## ✨ Key Features

### 🔧 Core Functionality
- **Team Management**: Create, edit, and delete teams with custom folder lists
- **User Management**: Create, edit, and delete users with team assignments
- **GitHub Integration**: Import users from GitHub with avatars and profile links
- **Auto-Sync**: Automatically sync GitHub users on every service restart
- **Inheritance Rules**: Users automatically inherit team folders unless custom folders are specified
- **Real-time Updates**: UI updates instantly without page refresh

### 🎨 User Interface
- **Modern Design**: Clean, responsive interface using Bootstrap 5
- **Tabbed Navigation**: Separate views for Teams and Users
- **GitHub Avatars**: Display user profile pictures from GitHub
- **Profile Links**: Click user names to open GitHub profiles
- **Visual Indicators**: Clear status badges showing inheritance vs custom folders
- **Light/Dark Theme**: Toggle between light and dark themes with improved contrast
- **Responsive Layout**: Works on desktop and mobile devices
- **Search Functionality**: Search teams and users in real-time
- **Team Details Modal**: View detailed team information, member counts, and statistics

### 💾 Data Management
- **PostgreSQL Database**: Production-ready database with proper relations
- **GitHub User Import**: Bulk import users from GitHub JSON data
- **Auto-Import**: GitHub users automatically imported on service startup
- **CRUD Operations**: Full Create, Read, Update, Delete functionality
- **Data Validation**: Input validation and error handling
- **Transaction Support**: All operations wrapped in database transactions
- **Data Integrity**: Foreign key constraints and cascading deletes

### 🔍 Command Line Tools
- **Permission Checker**: Check which folders a user has access to
- **GitHub Sync**: Script to get all users from GitHub organization
- **Auto-Startup**: Integrated GitHub import on service restart

## 🛠️ Technology Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL with `pg` driver
- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript
- **Styling**: Bootstrap 5 + Custom CSS with theme support
- **Icons**: Bootstrap Icons
- **Environment**: dotenv for configuration management
- **Scripts**: Bash scripts for GitHub integration and permission checking

## 🚀 Quick Start

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)
- PostgreSQL database (local or cloud)
- GitHub Personal Access Token (for auto-import)

### 1. Database Setup

**Option A: Local PostgreSQL**
```sql
CREATE DATABASE folder_config;
```

**Option B: Cloud Database (DigitalOcean, Heroku, etc.)**
- Create a PostgreSQL database in your cloud provider
- Get the connection URL

### 2. Environment Configuration
Create a `.env` file in your project root:
```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/folder_config

# For cloud database (example: DigitalOcean)
DATABASE_URL=postgresql://doadmin:password@host:port/folder_config?sslmode=require

# GitHub Auto-Import (Optional - will auto-import users on startup)
GITHUB_TOKEN=ghp_your_github_token_here
GITHUB_ORG=your_org_name

# Skip GitHub Import (Optional - set to 'true' to skip import for faster startup)
SKIP_GITHUB_IMPORT=false
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Import GitHub Users

**Option A: Manual Import**
If you have a `github_users.json` file:
```bash
node import-github-users.js
```

**Option B: Auto-Import on Startup (Recommended)**
Set these environment variables in your `.env` file:
```bash
GITHUB_TOKEN=ghp_your_github_token_here
GITHUB_ORG=your_org_name
```

Then every time you run `npm start`, it will automatically:
1. Import all users from your GitHub organization
2. Start the web server
3. Keep your user list up-to-date

**Fast Startup Option**: If you want to skip GitHub import for faster startup, set:
```bash
SKIP_GITHUB_IMPORT=true
```

This is useful when:
- You don't need fresh user data
- You're in development/testing mode
- You want to start the service quickly

### 5. Start the Application
```bash
npm start
```

The app will be available at `http://localhost:3001`

## 📊 What Gets Created

### Database Tables
- **teams**: Team information and folder lists
- **team_folders**: Individual folders for each team
- **users**: User information with GitHub data
- **user_custom_folders**: Custom folders for specific users

### Initial Data
- **Dev Team**: `/Code`, `/Docs` folders
- **Design Team**: `/Art`, `/UI`, `/UX` folders
- **Sample Users**: Alice, Bob, Carol with inheritance examples

## 🔄 How It Works

### Folder Inheritance Logic
1. **User has no custom folders** → Uses team's default folders
2. **User has custom folders** → Custom folders override team defaults
3. **Team folders change** → All users using team defaults get updated automatically
4. **Combined Access**: Users with custom folders AND team access get BOTH sets of folders

### Example Scenarios
```
Team "Dev" has folders: /Code, /Docs

User Alice (no custom folders):
→ Effective folders: /Code, /Docs (inherited from team)

User Bob (custom folders: /Code, /Docs, /Tests):
→ Effective folders: /Code, /Docs, /Tests (custom override)

User Carol (custom folders: /Tests AND team member):
→ Effective folders: /Code, /Docs, /Tests (BOTH custom + team)

Team "Dev" changes to: /Code, /Docs, /Backup
→ Alice's folders update to: /Code, /Docs, /Backup
→ Bob's folders stay: /Code, /Docs, /Tests (unchanged)
→ Carol's folders update to: /Code, /Docs, /Backup, /Tests
```

## 📁 GitHub Integration

### Getting Users from GitHub
To get a list of users from your GitHub organization, use the GitHub API:

```bash
curl -H "Authorization: Bearer <PAT>" \
     -H "Accept: application/vnd.github+json" \
     "https://api.github.com/orgs/sipherxyz/members?per_page=100" > github_users.json
```

**Note**: Replace `<PAT>` with your GitHub Personal Access Token. You can create one at:
`https://github.com/settings/tokens`

**Required permissions for the token:**
- `read:org` - to read organization members
- `read:user` - to read user profile information

### Auto-Import Script
We provide a script that automatically gets ALL users (not just 100):

```bash
# Make executable
chmod +x get-all-github-users.sh

# Run the script
./get-all-github-users.sh sipherxyz ghp_your_token_here
```

This script:
- Handles pagination automatically
- Gets all users from your organization
- Saves to `github_users.json`
- Imports users into your database

### Importing Users
The tool can import users from GitHub with:
- **Profile pictures** (avatars)
- **GitHub usernames** and IDs
- **Profile links** (clickable names)
- **Team assignments** (users are imported without team assignment by default)

### Import Process
1. Get your GitHub users using the curl command above OR use our auto-script
2. Place the `github_users.json` file in the project root
3. Run: `node import-github-users.js`
4. Users appear in the UI with GitHub information

### GitHub API Response Format
The `github_users.json` file should contain an array of user objects like this:
```json
[
  {
    "login": "username",
    "id": 12345,
    "avatar_url": "https://avatars.githubusercontent.com/u/12345?v=4",
    "html_url": "https://github.com/username"
  }
]
```

## 🔍 Permission Checking

### Command Line Permission Checker
Check which folders a user has access to:

```bash
# Make executable
chmod +x check-user-permissions.sh

# Check user permissions
./check-user-permissions.sh "username"
```

**Example output:**
```bash
$ ./check-user-permissions.sh "John Doe"
Folders that user 'John Doe' has permission to access:
  Content/Art
  Content/Art/Anh
  Content/Art/Anh1
  Content/Art/Anh2
  Content/Art/Anh3
```

**What it shows:**
- User's custom folders
- Team default folders
- Effective folders (combination of both)
- Clear indication if no folders are assigned

### Database Connection
The script connects to your PostgreSQL database using the same connection string as your web app.

## 🎯 Usage Examples

### Adding a New Team
1. Click "Teams" tab
2. Click "Add Team" button
3. Enter team name (e.g., "Marketing")
4. Enter folders (one per line):
   ```
   /Brand
   /Campaigns
   /Assets
   ```
5. Click "Save Team"

### Adding a New User
1. Click "Users" tab
2. Click "Add User" button
3. Enter user name
4. Select a team from dropdown
5. Optionally enter custom folders
6. Click "Save User"

### Managing Existing Users
- **Edit**: Click pencil icon to modify user details
- **Delete**: Click trash icon to remove users
- **View**: See effective folders and inheritance status

### Adding Users to Teams
1. Click "Teams" tab
2. Click "Add Team" button
3. Fill in team details
4. In "Add Users (Optional)" section:
   - Use search bar to find users
   - Click users to select them
   - Selected users show with avatars and team status
5. Click "Save Team"

## 🔌 API Endpoints

### Teams
- `GET /api/teams` - Get all teams with folders
- `GET /api/teams/:id` - Get specific team
- `POST /api/teams` - Create new team
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

### Users
- `GET /api/users` - Get all users with effective folders
- `GET /api/users/:id` - Get specific user
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🎨 Customization

### Theme System
The app includes a light/dark theme toggle:
- **Light Theme**: Clean, professional look with improved contrast
- **Dark Theme**: Easy on the eyes for extended use with enhanced readability
- **Persistent**: Theme choice saved in browser

### Styling
- Modify `public/styles.css` for custom colors and layouts
- Update Bootstrap classes in `public/index.html`
- Add new CSS variables for theme customization

### Database
- **PostgreSQL**: Currently implemented with full CRUD operations
- **Easy Migration**: Database layer is abstracted for easy switching
- **Connection Pooling**: Optimized for production use

## 🚨 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Change port
PORT=3001 npm start
```

**Database connection failed:**
- Check your `.env` file has correct `DATABASE_URL`
- Verify PostgreSQL is running
- Check SSL settings for cloud databases

**GitHub users not showing:**
- Run the import script: `node import-github-users.js`
- Check browser console for errors
- Verify the database has users
- Ensure `GITHUB_TOKEN` and `GITHUB_ORG` are set in `.env`

**Dependencies not found:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Permission checker script not working:**
- Ensure script is executable: `chmod +x check-user-permissions.sh`
- Check database connection in script
- Verify user exists in database

### Debug Mode
Add logging to see what's happening:
```javascript
// In server.js
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});
```

## 🔮 Future Enhancements

### Planned Features
- **User Groups**: Create custom user groups with specific folder access
- **Audit Logs**: Track folder changes and user access
- **Bulk Operations**: Import/export teams and users
- **Advanced Permissions**: Granular folder access control
- **API Authentication**: Secure API endpoints

### Easy to Add
- **New Database**: Switch to MySQL, MongoDB, etc.
- **Authentication**: Add login system
- **File Management**: Integrate with actual file systems
- **Notifications**: Email alerts for folder changes

## 🏗️ Project Structure

```
folder-config-tool/
├── startup.js                 # Main startup script with GitHub auto-import
├── server.js                  # Express server and API routes
├── db.js                      # PostgreSQL database operations
├── import-github-users.js     # GitHub user import script
├── get-all-github-users.sh    # Script to get all GitHub users
├── check-user-permissions.sh  # Script to check user folder permissions
├── package.json               # Dependencies and scripts
├── .env                       # Environment variables (create this)
├── .gitignore                # Git ignore rules
├── public/                    # Frontend files
│   ├── index.html            # Main application page
│   ├── script.js             # Frontend JavaScript logic
│   └── styles.css            # Custom styling and themes
├── Dockerfile                 # Docker image for development and production
├── docker-compose.yml         # Multi-service Docker setup
├── .dockerignore              # Docker build exclusions
├── docker-run.sh              # Docker helper script
├── init.sql                   # Database initialization script
├── DOCKER.md                  # Docker deployment guide
└── README.md                  # This file
```

## 🚀 Quick Commands

### Start the Service
```bash
npm start                    # Start with GitHub auto-import
npm run dev                  # Development mode with auto-reload

# Fast startup (skip GitHub import)
SKIP_GITHUB_IMPORT=true npm start
```

### Docker Deployment
```bash
# Quick start with Docker Compose
docker-compose up -d

# Build and run image
docker build -t folder-config-tool:latest .
docker run -d -p 3001:3001 folder-config-tool:latest

# See DOCKER.md for complete Docker guide
```

### Environment-Based Configuration

The same Docker setup works for both development and production:

```bash
# Development (includes PostgreSQL)
docker-compose up -d

# Production (use external database)
DATABASE_URL="your_production_db_url" \
NODE_ENV=production \
docker-compose up -d
```

### GitHub Operations
```bash
# Get all users from GitHub
./get-all-github-users.sh <org_name> <token>

# Manual import
node import-github-users.js

# Check user permissions
./check-user-permissions.sh <username>
```

### Database Operations
```bash
# Check database connection
psql "$DATABASE_URL" -c "SELECT 1;"

# View users
psql "$DATABASE_URL" -c "SELECT name, team_id FROM users;"

# View teams
psql "$DATABASE_URL" -c "SELECT name FROM teams;"
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

## 📄 License

MIT License - feel free to use and modify as needed.

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console for JavaScript errors
3. Check server logs for backend errors
4. Verify database connection and `.env` file
5. Ensure all dependencies are installed
6. Check GitHub token permissions and organization access

---

**Built with ❤️ using Node.js, Express, PostgreSQL, and modern web technologies**

*Last updated: August 2024*
