#!/bin/bash

echo "Starting Genie Marketplace Development Environment"
echo "================================================"

echo ""
echo "Step 1: Checking MongoDB"
echo "------------------------"
if command -v mongod &> /dev/null; then
    echo "✅ MongoDB found"
    # Try to start MongoDB if it's not running
    if ! pgrep -x "mongod" > /dev/null; then
        echo "Starting MongoDB..."
        mongod --fork --logpath /tmp/mongodb.log --dbpath /tmp/mongodb-data 2>/dev/null || echo "⚠️  Please start MongoDB manually"
    else
        echo "✅ MongoDB already running"
    fi
else
    echo "⚠️  MongoDB not found - please install and start MongoDB manually"
fi

echo ""
echo "Step 2: Starting Server (Port 5000)"
echo "-----------------------------------"
cd server
gnome-terminal --title="Genie Server" -- bash -c "npm run dev; exec bash" 2>/dev/null || \
xterm -title "Genie Server" -e "npm run dev" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)' && npm run dev"' 2>/dev/null || \
echo "⚠️  Could not open terminal for server. Please run 'npm run dev' in server directory manually"
cd ..

echo ""
echo "Step 3: Waiting for server to start..."
sleep 5

echo ""
echo "Step 4: Starting Client (Port 5173)"
echo "-----------------------------------"
cd client
gnome-terminal --title="Genie Client" -- bash -c "npm run dev; exec bash" 2>/dev/null || \
xterm -title "Genie Client" -e "npm run dev" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)' && npm run dev"' 2>/dev/null || \
echo "⚠️  Could not open terminal for client. Please run 'npm run dev' in client directory manually"
cd ..

echo ""
echo "================================================"
echo "Marketplace Development Environment Started!"
echo "================================================"
echo ""
echo "Server: http://localhost:5000"
echo "Client: http://localhost:5173"
echo ""
echo "If terminals didn't open automatically, please run:"
echo "  Terminal 1: cd server && npm run dev"
echo "  Terminal 2: cd client && npm run dev"
echo ""
echo "If you see 'Demo Mode' warnings, check the Quick Fix Guide."