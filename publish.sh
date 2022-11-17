#!/bin/sh

# Show current version
echo "Current version:" `npm view @hivekit/client-js version`

# Get version number
read -p "Enter the new version number: " version

# Run tests?
npm run test-only

# Stop things if test failed
if [ $? -ne 0 ]; then  
    echo "TESTS FAILED"; exit 1; 
fi

# replace version in hivekit client file so that it can be read from the client side
sed -i -E "s/this.version = '.+';/this.version = '${version}';/" src/hivekit-client.js

# Replace version in package.json
npm version ${version}

# Build browser bundle
npm run build

# Commit and Push to git
git add -A
git commit -m "publishing version ${version}"
git push
git tag ${version}
git push --tags

# Publish to npm
npm publish