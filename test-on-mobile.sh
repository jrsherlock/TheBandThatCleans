#!/bin/bash

# TBTC Mobile Testing Helper Script
# This script helps you test the AR game on your iPhone

echo "🎮 TBTC Mobile Testing Helper"
echo "=============================="
echo ""

# Check if ngrok is installed
if command -v ngrok &> /dev/null; then
    echo "✅ ngrok is installed"
    USE_NGROK=true
else
    echo "⚠️  ngrok is not installed"
    echo ""
    echo "To install ngrok:"
    echo "  brew install ngrok"
    echo ""
    USE_NGROK=false
fi

# Get local IP address
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)

echo ""
echo "📱 Testing Options:"
echo ""

if [ "$USE_NGROK" = true ]; then
    echo "Option 1: ngrok (Recommended - Provides HTTPS)"
    echo "  1. Make sure dev server is running: npm run dev"
    echo "  2. Run: ngrok http 3000"
    echo "  3. Open the https:// URL on your iPhone"
    echo ""
fi

echo "Option 2: Local Network (HTTP only - Limited AR support)"
echo "  1. Make sure dev server is running: npm run dev"
echo "  2. Connect iPhone to same WiFi"
echo "  3. Open on iPhone: http://$LOCAL_IP:3000"
echo ""

echo "Option 3: Local HTTPS (Requires setup)"
echo "  1. Install mkcert: brew install mkcert"
echo "  2. Run: mkcert -install"
echo "  3. Run: mkcert localhost $LOCAL_IP"
echo "  4. Restart dev server: npm run dev"
echo "  5. Open on iPhone: https://$LOCAL_IP:3000"
echo ""

echo "=============================="
echo ""
echo "Your local IP address: $LOCAL_IP"
echo ""

# Ask user what they want to do
echo "What would you like to do?"
echo "1) Start ngrok tunnel (if installed)"
echo "2) Show local network URL"
echo "3) Exit"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        if [ "$USE_NGROK" = true ]; then
            echo ""
            echo "Starting ngrok tunnel..."
            echo "Make sure your dev server is running in another terminal!"
            echo ""
            ngrok http 3000
        else
            echo "ngrok is not installed. Please install it first:"
            echo "  brew install ngrok"
        fi
        ;;
    2)
        echo ""
        echo "📱 Open this URL on your iPhone:"
        echo "   http://$LOCAL_IP:3000"
        echo ""
        echo "⚠️  Note: This is HTTP, not HTTPS."
        echo "   AR features may not work without HTTPS."
        echo "   Use ngrok for full AR functionality."
        ;;
    3)
        echo "Goodbye!"
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

