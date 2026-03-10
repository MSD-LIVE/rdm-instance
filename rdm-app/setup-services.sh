#!/bin/bash

# Script to initialize InvenioRDM services (runs once during container creation)
# This script should be run from the rdm-app directory

set -e
echo "adding git safe directories"
# add our submodules to git safe directory config otherwise vs code's source control will not show changes to them
git config --global --add safe.directory /workspaces/rdm-instance/invenio-app-rdm
git config --global --add safe.directory /workspaces/rdm-instance/invenio-rdm-records-v13
git config --global --add safe.directory /workspaces/rdm-instance/invenio-requests
git config --global --add safe.directory /workspaces/rdm-instance/invenio-cli
git config --global --add safe.directory /workspaces/rdm-instance/msdlive-rdm-contrib

# Change to the correct directory
cd /workspaces/rdm-instance/rdm-app

echo "Installing dependencies"
pip install pipenv invenio-cli && pipenv sync --dev && pipenv run pip install debugpy elinkapi boto3~=1.40 sentry-sdk gunicorn
# installing boto3 will install 1.41 which pip says: aiobotocore 2.25.1 requires botocore<1.40.62,>=1.40.46, but you have botocore 1.41.6 which is incompatible.


echo "🔧 Initializing InvenioRDM services..."

echo "Installing MSD-LIVE RDM App"
invenio-cli install

echo "🛠️  Installing customized RDM packages..."
pipenv run invenio-cli packages install  /workspaces/rdm-instance/invenio-rdm-records-v13 /workspaces/rdm-instance/invenio-app-rdm /workspaces/rdm-instance/invenio-requests 
# TODO add to packages install line /workspaces/rdm-instance/msdlive-rdm-contrib
echo "✅ Installing packages complete!"

# Check if services need to be set up
if grep -q "services_setup = False" .invenio.private 2>/dev/null; then
    echo "🛠️  Setting up services (this may take a few minutes)..."
    pipenv run invenio-cli services setup -N --stop-services
    echo "✅ Services setup complete!"
else
    echo "✅ Services and packages already initialized."
fi

# Trigger the VS Code extension to restart the assets watch process
# Note: We use a file watcher because we cannot directly execute VS Code extension commands 
# (like rdm-assets.restartRdmAssetsWatch) from a shell script running in the terminal.
echo "🔄 Triggering RDM Assets Watch restart..."
touch ".rdm-ready";
