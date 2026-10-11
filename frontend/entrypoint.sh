#!/bin/sh
set -e

if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/next" ]; then
    echo "Installing dependencies..."
    rm -rf node_modules || true
    npm install
fi

if [ $# -eq 0 ]; then
    exec npm run dev
else
    exec "$@"
fi