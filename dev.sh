#!/bin/bash

# React Dashboard Development Script
# This script handles all development tasks

set -e  # Exit on error

echo "🚀 React Dashboard Development Mode"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Kill any existing Vite process on port 5173
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}🔄 Stopping existing dev server...${NC}"
    # Only kill node processes (Vite), not the bash script
    lsof -ti:5173 | xargs ps -p 2>/dev/null | grep -E 'node|vite' | awk '{print $1}' | xargs kill -9 2>/dev/null || true
    sleep 2
fi

echo -e "${GREEN}✅ Starting development server...${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Access the dev server from YOUR COMPUTER, not from Home Assistant!${NC}"
echo ""
echo -e "${BLUE}📱 Open in your browser: ${GREEN}http://localhost:5173${NC}"
echo -e "${BLUE}🏠 Alternative (if on same network): http://$(hostname -I | awk '{print $1}'):5173${NC}"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "  - This is NOT accessible from ${YELLOW}192.168.1.7:5173${NC} (that's your HA server)"
echo "  - Changes will auto-reload (HMR enabled)"
echo "  - Production version remains at: http://192.168.1.7:8123 → React Dashboard"
echo ""

# Start the dev server
npm run dev