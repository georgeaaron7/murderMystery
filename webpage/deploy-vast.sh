#!/bin/bash

# Vast.ai Backend Deployment Script
echo "🚀 Starting Detective Game Backend Setup on Vast.ai..."

# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org

# Start MongoDB
systemctl start mongod
systemctl enable mongod

# Install PM2 for process management
npm install -g pm2

# Navigate to app directory
cd /workspace/detective-backend

# Install dependencies
npm install

# Set environment variables for Vast.ai
export MONGODB_URI="mongodb://localhost:27017/detective_game"
export VLLM_ENDPOINT="http://198.53.64.194:40610/v1/chat/completions"
export PORT=5000

# Start the backend with PM2
pm2 start server.js --name detective-backend

# Save PM2 configuration
pm2 save
pm2 startup

echo "✅ Backend deployed successfully!"
echo "🌐 Backend running on port 5000"
echo "💾 MongoDB running on port 27017"
echo "🤖 vLLM endpoint: localhost:40610"
