#!/bin/sh

# Execute npm version in the main workspace:
  # version script will run the build
  #   Increase package.json version in the main workspace 
  #   and generate README.md and manifest.json
  # postversion the changes in the main workspace
  # Run the build script in the main workspace

  # Push the changes in the main workspace
  # Run the publish command in the CLI-deploy workspace
  # Remove the oclif.manifest.json

# Generate the manifest and readme
npm run generate:docs 

# Copy readme and manifest to deploy workspace
cp README.md oclif.manifest.json ./CLI-deploy 

# Build / compact the code and save it in the deploy workspace
npm run build 

# Get the current version of the package
VERSION=$(cat package.json | jq .version) 

# Make sure version to be published is the same as the one in the main workspace
npm version $VERSION --workspace=CLI-deploy

# Publish the code in the deploy workspace
npm publish --workspace=CLI-deploy --dry-run

# Remove the manifest from main and deploy workspaces
rm -f oclif.manifest.json ./CLI-deploy/oclif.manifest.json