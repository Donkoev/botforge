# frontend/Dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
# In production, we typically use Nginx to serve static files. 
# But in our docker-compose.yml we have a separate Nginx service that proxies to backend and frontend?
# Wait, standard pattern: 
# 1. Frontend container builds static files.
# 2. These files are mounted to Nginx container OR Nginx is inside Frontend container.
#
# Our docker-compose.yml says:
#   nginx: depends_on frontend
#
# BUT, usually Nginx is the one executing.
# Let's look at the prompt structure:
# nginx/Dockerfile
# nginx/nginx.conf
#
# So there is a separate Nginx service.
# If so, the Frontend container in production just needs to exit after build? Or hold the files?
#
# Prompt says: "nginx — reverse proxy (API → backend:8000, всё остальное → frontend static)"
# This usually means Nginx serves the static files.
# How does Nginx get the files? Volumes?
# Or the "frontend" service in docker-compose is just for development?
#
# In docker-compose.yml (PROD):
# frontend:
#   build: ./frontend
# ...
# nginx:
#   build: ./nginx
#
# Realistically, for a "full" setup:
# Option A: Frontend container builds files, then copies them to a shared volume.
# Option B: Nginx build process copies files from a frontend build stage (multi-stage in Nginx Dockerfile).
#
# Let's check the task description for Nginx:
# "frontend — сборка React (multi-stage: node для билда → nginx для раздачи)" — Aha!
# So the frontend container ITSELF should run Nginx to serve its static files?
# 
# BUT there is ALSO a main Nginx reverse proxy.
# Maybe the main Nginx proxies to the Frontend container's Nginx?
# "nginx — reverse proxy (API → backend:8000, всё остальное → frontend static)"
#
# Initial implementation plan:
# Frontend container runs Nginx on port 80 to serve static files.
# Main Nginx proxies /api -> Backend, / -> Frontend container.
#
# So here is the Frontend Dockerfile that runs Nginx.

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
