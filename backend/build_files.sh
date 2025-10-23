#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting Django build process with Python3..."

# Install dependencies
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

# Make sure static directory exists
mkdir -p staticfiles

# Apply database migrations
echo "🗃️ Running database migrations..."
python3 manage.py migrate --noinput

# Collect static files
echo "🎨 Collecting static files..."
python3 manage.py collectstatic --noinput --clear

# Ensure media directory exists (optional)
mkdir -p media

echo "✅ Build process completed successfully!"
