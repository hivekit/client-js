#!/bin/sh

# Make sure everything stops if command fails
set -e 
set -o pipefail

# Show current version
echo "Current version:" `npm view @hivekit/client-js version`

# Get version number
read -p "Enter the new version number: " version

# Run tests?
npm run test-only

# Replace version in package.json
npm version ${version}

# Build browser bundle
npm run build-browser-bundle

# Commit and Push to git
git add -A
git commit -m "publishing version ${version}"
git tag ${version}
git push
git push --tags

# Publish to npm
npm publish