#!/bin/bash

# Simple script to get ALL users from GitHub organization and import them
# Usage: ./get-all-github-users.sh <org_name> <github_token>

# Check arguments
if [ $# -ne 2 ]; then
    echo "Usage: $0 <org_name> <github_token>"
    echo "Example: $0 sipherxyz your_token_here"
    exit 1
fi

org_name="$1"
token="$2"

echo "Getting all users from GitHub org: $org_name"

# Create output file
echo "[" > github_users.json

page=1
first_page=true

# Loop through all pages
while true; do
    echo "Getting page $page..."
    
    # Get users from this page
    response=$(curl -s -H "Authorization: Bearer $token" \
        -H "Accept: application/vnd.github+json" \
        "https://api.github.com/orgs/$org_name/members?per_page=100&page=$page")
    
    # Check if response has users
    if echo "$response" | grep -q '"id"'; then
        # Add comma if not first page
        if [ "$first_page" = true ]; then
            first_page=false
        else
            echo "," >> github_users.json
        fi
        
        # Extract and format users (remove outer brackets and add to file)
        users=$(echo "$response" | sed 's/^\[//' | sed 's/\]$//')
        echo "$users" >> github_users.json
        
        echo "Page $page: Got users"
        page=$((page + 1))
        
        # Small delay to be nice to GitHub API
        sleep 0.1
    else
        echo "No more users found. Done!"
        break
    fi
done

echo "]" >> github_users.json

echo ""
echo "✅ All users saved to github_users.json"
echo "📊 Total pages fetched: $((page - 1))"

# Import users into database
echo ""
echo "🔄 Importing users into database..."
node import-github-users.js

echo ""
echo "🎉 Done! Check your web app to see the imported users."
