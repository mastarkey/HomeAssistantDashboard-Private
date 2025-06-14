#!/bin/bash

echo "🚀 Starting Home Assistant React Dashboard..."
echo ""
echo "📍 Dashboard will be available at:"
echo "   - http://homeassistant.local:5173"
echo "   - http://192.168.1.7:5173"
echo ""
echo "🔑 Access token is already configured"
echo ""
echo "📱 To access from Home Assistant sidebar:"
echo "   1. Restart Home Assistant to load the new configuration"
echo "   2. Look for 'React Dashboard' in the sidebar"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd /homeassistant/react-dashboard
npm run dev