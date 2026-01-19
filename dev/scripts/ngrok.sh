#!/bin/bash

# Ngrok script to expose local port 8080
# This script starts ngrok and exposes the local development server

PORT=${1:-8080}

echo "🚀 Starting ngrok on port $PORT..."
echo "-----------------------------------"
echo "Press Ctrl+C to stop ngrok"
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ Error: ngrok is not installed"
    echo ""
    echo "To install ngrok:"
    echo "  - follow the guide at https://ngrok.com/docs/guides/device-gateway/linux"
    echo ""
    exit 1
fi

# Start ngrok
ngrok http $PORT
