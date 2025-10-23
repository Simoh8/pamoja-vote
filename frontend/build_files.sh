#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

echo "⚛️ Starting React frontend build process..."

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Build frontend
echo "🔨 Building React application..."
npm run build

echo "✅ Frontend build completed successfully!"
echo "📄 Build files are ready in: ./dist/"
echo "🚀 Ready for deployment to Vercel or other static hosting service"