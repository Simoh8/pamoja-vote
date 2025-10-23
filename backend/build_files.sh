#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting Django build process with Python3..."

# Install Python dependencies
echo "📦 Installing dependencies..."
pip3 install -r requirements.txt

# Run migrations
echo "🗃️ Running database migrations..."
python3 manage.py migrate --noinput

# Collect static files
echo "🎨 Collecting static files..."
python3 manage.py collectstatic --noinput

echo "✅ Build process completed successfully!"
