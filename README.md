# Folder Configuration Tool

A web-based tool for managing folder configurations for teams and individual users with inheritance rules. Built with Node.js/Express backend and modern HTML/CSS/JavaScript frontend.

## Features

### Core Functionality
- **Team Management**: Create, edit, and delete teams with custom folder lists
- **User Management**: Create, edit, and delete users with team assignments
- **Inheritance Rules**: Users automatically inherit team folders unless custom folders are specified
- **Real-time Updates**: UI updates instantly without page refresh

### User Interface
- **Modern Design**: Clean, responsive interface using Bootstrap 5
- **Tabbed Navigation**: Separate views for Teams and Users
- **Search & Filter**: Real-time search functionality for both teams and users
- **Visual Indicators**: Clear status indicators showing when users use team defaults vs custom folders
- **Responsive Layout**: Works on desktop and mobile devices

### Data Management
- **In-Memory Storage**: Simple data storage for demo purposes
- **CRUD Operations**: Full Create, Read, Update, Delete functionality
- **Validation**: Input validation and error handling
- **Toast Notifications**: User feedback for all operations

## Technology Stack

- **Backend**: Node.js + Express
- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript
- **Styling**: Bootstrap 5 + Custom CSS
- **Icons**: Bootstrap Icons
- **Data Storage**: In-memory (easily swappable with database)

## Quick Start

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation

1. **Clone or download the project files**
   ```bash
   # If you have the files locally, navigate to the project directory
   cd folder-config-tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Development Mode
For development with auto-restart on file changes:
```bash
npm run dev
```

## Usage Examples

### Preloaded Data
The application starts with example data:

**Teams:**
- **Dev Team**: `/Code`, `/Docs`
- **Design Team**: `/Art`, `/UI`, `/UX`

**Users:**
- **Alice** (Dev Team): Uses team default folders → `/Code`, `/Docs`
- **Bob** (Dev Team): Custom folders → `/Code`, `/Docs`, `/Tests`
- **Carol** (Design Team): Uses team default folders → `/Art`, `/UI`, `/UX`

### Adding a New Team
1. Click the "Teams" tab
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
1. Click the "Users" tab
2. Click "Add User" button
3. Enter user name (e.g., "David")
4. Select a team from dropdown
5. Optionally enter custom folders (leave empty to use team default)
6. Click "Save User"

### Understanding Inheritance
- **Team Default**: When a user has no custom folders, they automatically use their team's folder list
- **Custom Override**: When a user has custom folders, these completely replace the team's folder list
- **Real-time Updates**: Changing a team's folders immediately affects all users using team defaults

## API Endpoints

### Teams
- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get team by ID
- `POST /api/teams` - Create new team
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

### Users
- `GET /api/users` - Get all users with effective folders
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Data Structure

### Team Object
```json
{
  "id": 1,
  "name": "Dev",
  "folders": ["/Code", "/Docs"]
}
```

### User Object
```json
{
  "id": 1,
  "name": "Alice",
  "teamId": 1,
  "customFolders": null,
  "teamName": "Dev",
  "effectiveFolders": ["/Code", "/Docs"],
  "isUsingTeamDefault": true
}
```

## Customization

### Adding Database Support
The current implementation uses in-memory storage. To add database support:

1. Install your preferred database driver (e.g., `npm install sqlite3` for SQLite)
2. Replace the in-memory arrays with database queries
3. Update the CRUD functions to use database operations

### Styling Changes
- Modify `public/styles.css` for custom styling
- Update Bootstrap classes in `public/index.html`
- Add new CSS classes for additional visual elements

### Adding New Features
- Extend the backend API in `server.js`
- Add new UI components in `public/index.html`
- Implement frontend logic in `public/script.js`

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Change port in server.js or set environment variable
PORT=3001 npm start
```

**Dependencies not found:**
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Browser compatibility:**
- Ensure you're using a modern browser (Chrome, Firefox, Safari, Edge)
- Check browser console for JavaScript errors

### Debug Mode
Enable detailed logging by adding to `server.js`:
```javascript
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use and modify as needed.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the browser console for errors
3. Verify all dependencies are installed
4. Ensure the backend server is running

---

**Built with ❤️ using modern web technologies**
