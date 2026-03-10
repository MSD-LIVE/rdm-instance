#!/bin/bash

# Script to start InvenioRDM development services and assets
# This script runs every time the container starts

set -e

# Change to the correct directory
cd /workspaces/rdm-instance/rdm-app

echo "🚀 Starting InvenioRDM development environment..."

# Check if .invenio.private file exists
if [ ! -f ".invenio.private" ]; then
    echo "⚠️  .invenio.private not found. Running initial setup..."
    /workspaces/rdm-instance/rdm-app/setup-services.sh
fi

# Check if services are initialized
if grep -q "services_setup = True" .invenio.private 2>/dev/null; then
    echo "✅ Starting services..."
    pipenv run invenio-cli services start
    # should we do this? or keep the debug config as it is to run the worker?
    # Start the worker in the background
    # pipenv run invenio-cli run worker &
else
    echo "⚠️  Services not initialized. Please run setup-services.sh first."
    exit 1
fi

# call the python script in /workspaces/rdm-instance/overrides/link-overrides.py
echo "🔗 Linking override files..."
python /workspaces/rdm-instance/overrides/link-overrides.py

echo "✅ Services started. Use the 'VS Code Debugger' to start RDM."