#!/bin/sh

# Generate the manifest and readme
npm run generate:docs

# Install the exact packages from package-lock
npm ci

# Copy readme and manifest to deploy workspace
cp README.md oclif.manifest.json ./CLI-deploy 

# Build / compact the code and save it in the deploy workspace
npm run build 

# Get the current version of the package to be published
VERSION=$(cat package.json | jq -r .version) 

# Make sure version to be published is the same as the one in the main workspace
npm version $VERSION --workspace=CLI-deploy

# Publish the code in the deploy workspace
npm publish --workspace=CLI-deploy

# Remove the manifest from main and deploy workspaces
rm -f oclif.manifest.json ./CLI-deploy/oclif.manifest.json

# Add the README.md package.json from the CLI to the publish commit
git add README.md ./CLI-deploy