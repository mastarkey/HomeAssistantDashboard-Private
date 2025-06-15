#!/bin/bash

# React Dashboard Rollback Script
# Restores the previous deployment from backup

set -e  # Exit on error

echo "🔄 React Dashboard Rollback"
echo "=========================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
WWW_DIR="/config/www/react-dashboard"
BACKUP_DIR="/config/www/react-dashboard-backup"

# Check if backup exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}❌ No backup found at $BACKUP_DIR${NC}"
    echo "Cannot rollback without a backup."
    exit 1
fi

echo -e "${YELLOW}⚠️  This will restore the previous deployment${NC}"
read -p "Are you sure you want to rollback? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Rollback cancelled."
    exit 0
fi

# Perform rollback
echo -e "${YELLOW}🔄 Restoring from backup...${NC}"
rm -rf "$WWW_DIR"
cp -r "$BACKUP_DIR" "$WWW_DIR"

echo -e "${GREEN}✅ Rollback complete!${NC}"
echo ""
echo "Please clear your browser cache and refresh Home Assistant."