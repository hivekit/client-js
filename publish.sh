#!/bin/sh
read -p "Enter the new version number: " version

sed -i '/version/s/[^\"]*$/'"${version}\"/" package.json