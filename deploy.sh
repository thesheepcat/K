#!/bin/bash

# Production deployment script for React app K
set -e

echo "🚀 Starting deployment process..."

# Build the application
echo "📦 Building the application..."
npm run build:prod

# Create deployment directory if it doesn't exist
DEPLOY_DIR="/var/www/K"
sudo mkdir -p $DEPLOY_DIR

# Backup current deployment (optional)
if [ -d "$DEPLOY_DIR/dist" ]; then
    echo "📋 Creating backup..."
    sudo mv $DEPLOY_DIR/dist $DEPLOY_DIR/dist.backup.$(date +%Y%m%d_%H%M%S)
fi

# Copy built files to deployment directory
echo "📂 Copying files to deployment directory..."
sudo cp -r dist $DEPLOY_DIR/
sudo chown -R www-data:www-data $DEPLOY_DIR/dist
sudo chmod -R 755 $DEPLOY_DIR/dist

# Test nginx configuration
echo "🔧 Testing nginx configuration..."
sudo nginx -t

# Reload nginx
echo "🔄 Reloading nginx..."
sudo systemctl reload nginx

echo "✅ Deployment completed successfully!"
echo "🌐 Your app should now be available at https://your-domain.com"