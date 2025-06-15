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

# Kill any existing process on port 5173
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}🔄 Stopping existing dev server...${NC}"
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

echo -e "${GREEN}✅ Starting development server...${NC}"
echo -e "${BLUE}📱 Local URL: http://localhost:5173${NC}"
echo -e "${BLUE}🏠 Network URL: http://192.168.1.7:5173${NC}"
echo -e "${BLUE}📊 Home Assistant: http://192.168.1.7:8123${NC}"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "  - Changes will auto-reload (HMR enabled)"
echo "  - Press 'q' to quit"
echo "  - Press 'r' to restart"
echo "  - Press 'h' to show help"
echo ""

# Start the dev server
npm run dev