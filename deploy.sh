#!/bin/bash

# React Dashboard Production Deployment Script
# This script handles building and deploying to Home Assistant

set -e  # Exit on error

echo "🏗️  React Dashboard Production Deployment"
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
WWW_DIR="/config/www/react-dashboard"
BACKUP_DIR="/config/www/react-dashboard-backup"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Create backup of existing deployment
if [ -d "$WWW_DIR" ]; then
    echo -e "${BLUE}📂 Creating backup of existing deployment...${NC}"
    rm -rf "$BACKUP_DIR" 2>/dev/null || true
    cp -r "$WWW_DIR" "$BACKUP_DIR"
fi

# Build for Home Assistant
echo -e "${YELLOW}🔨 Building for Home Assistant...${NC}"
npm run build:ha

# Check if build was successful
if [ ! -f "dist-ha/ha-panel-wrapper.js" ]; then
    echo -e "${RED}❌ Build failed! No output files found.${NC}"
    exit 1
fi

# Create directory if it doesn't exist
echo -e "${BLUE}📁 Creating deployment directory...${NC}"
mkdir -p "$WWW_DIR"

# Deploy files
echo -e "${BLUE}📤 Deploying files to Home Assistant...${NC}"
cp -v dist-ha/ha-panel-wrapper.js "$WWW_DIR/react-dashboard-panel.js"
cp -v dist-ha/react-dashboard-panel.css "$WWW_DIR/"

# Check if supporting files exist
echo -e "${BLUE}🔍 Checking supporting files...${NC}"

if [ ! -f "/config/www/react-dashboard-working.js" ]; then
    echo -e "${YELLOW}⚠️  Warning: /config/www/react-dashboard-working.js not found${NC}"
    echo -e "${YELLOW}   This file is required for the panel to work${NC}"
fi

if [ ! -f "/config/www/react-dashboard-iframe.html" ]; then
    echo -e "${YELLOW}⚠️  Warning: /config/www/react-dashboard-iframe.html not found${NC}"
    echo -e "${YELLOW}   This file is required for the iframe integration${NC}"
fi

# Show deployment info
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "  1. Clear your browser cache (Ctrl+Shift+R)"
echo "  2. Refresh Home Assistant"
echo "  3. Click 'React Dashboard' in the sidebar"
echo ""
echo -e "${BLUE}💡 Tips:${NC}"
echo "  - If you see old content, hard refresh again"
echo "  - Check browser console for any errors"
echo "  - Backup saved at: $BACKUP_DIR"
echo ""

# Show file sizes
echo -e "${BLUE}📊 Deployment info:${NC}"
ls -lh "$WWW_DIR/"*.js "$WWW_DIR/"*.css 2>/dev/null | awk '{print "  - " $9 ": " $5}'

# Offer to check configuration
echo ""
read -p "Would you like to check if panel_custom is configured? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if grep -q "react-dashboard-working" /config/configuration.yaml; then
        echo -e "${GREEN}✅ panel_custom configuration found${NC}"
    else
        echo -e "${YELLOW}⚠️  panel_custom configuration not found in configuration.yaml${NC}"
        echo ""
        echo "Add this to your configuration.yaml:"
        echo ""
        echo "panel_custom:"
        echo "  - name: react-dashboard-working"
        echo "    sidebar_title: React Dashboard"
        echo "    sidebar_icon: mdi:react"
        echo "    module_url: /local/react-dashboard-working.js"
    fi
fi