#!/bin/bash
# Server Update Script

echo "Fetching updates..."
git pull origin main

echo "Rebuilding and restarting services..."
# We use --no-cache for backend because pip dependencies might have changed
# Frontend build is multi-stage so it handles caching reasonably well, but we can force it if needed.
# For now, let's just build.

docker compose down
docker compose up -d --build

echo "Pruning unused images to save space..."
docker image prune -f

echo "Update complete!"
