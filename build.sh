#!/bin/bash
./node_modules/.bin/esbuild src/index-node.js --bundle --platform=node --outfile=dist/bundle-node.js
./node_modules/.bin/esbuild src/index-browser.js --bundle --outfile=dist/bundle-browser.js