#!/bin/sh

# Generate the manifest and readme
npm run generate:docs
# Copy readme and manifest to deploy workspace
cp README.md oclif.manifest.json ./CLI-deploy 

npm prune --omit=dev

node-prune

# Build / compact the code and save it in the deploy workspace
npm run build 

# Get the current version of the package to be published
VERSION=$(cat package.json | jq -r .version) 

# Get a possible publish tag from command line, if not set, it will publish to
# "latest"
PUBLISH_TAG=$1

# Make sure version to be published is the same as the one in the main workspace
npm version $VERSION --workspace=CLI-deploy

if [ -z $PUBLISH_TAG  ]; then
  # Publish the code to NPM with the "latest" tag
  echo "Publish to latest tag $PUBLISH_TAG"
  echo "npm publish --workspace=CLI-deploy"
else
  # Publish the code to NPM with the tag from the package version
  echo "Publish to specific tag: $PUBLISH_TAG"
  echo "npm publish --workspace=CLI-deploy --tag $PUBLISH_TAG"
fi

# Remove the manifest from main and deploy workspaces
rm -f oclif.manifest.json ./CLI-deploy/oclif.manifest.json

# Add the README.md package.json from the CLI to the publish commit
git add .

# Commit the changes
git commit -m "Publish $VERSION"

# Tag
git tag v$VERSION