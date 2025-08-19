#!/bin/bash

# Basic script to check which folders a user has permission to access
# Usage: ./check-user-permissions.sh <USERNAME>

USERNAME="$1"
DB_URL="$2"

# Check if USERNAME is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <USERNAME>"
    echo "Example: $0 john_doe"
    exit 1
fi



# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "Error: PostgreSQL client (psql) not found"
    exit 1
fi

# Get effective folders (what user actually has access to)
echo "Folders that user '$USERNAME' has permission to access:"

# Query combines custom folders and team folders
folders=$(psql "$DB_URL" -t -c "
    SELECT DISTINCT folder_path
    FROM (
        -- User's custom folders
        SELECT ucf.folder_path
        FROM users u
        JOIN user_custom_folders ucf ON u.id = ucf.user_id
        WHERE u.name = '$USERNAME'
        
        UNION
        
        -- Team default folders
        SELECT tf.folder_path
        FROM users u
        JOIN teams t ON u.team_id = t.id
        JOIN team_folders tf ON t.id = tf.team_id
        WHERE u.name = '$USERNAME'
    ) all_folders
    ORDER BY folder_path;
" | grep -v '^$')

if [ -z "$folders" ]; then
    echo ""
else
    echo "$folders" | while read folder; do
        if [ ! -z "$folder" ]; then
            echo "$folder"
        fi
    done
fi
