#!/bin/sh
read -p "Enter the new version number: " version

# Run tests?

# Replace version in package.json
# sed -i '/version/s/[^\"]*$/'"${version}\"/" package.json

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