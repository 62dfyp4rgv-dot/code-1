#!/usr/bin/env bash
# Copies the web app into the iOS bundle folder. Run before generating/building the Xcode project.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf ios/ModernAge/www && mkdir -p ios/ModernAge/www
cp -R app/index.html app/manifest.webmanifest app/css app/js app/data app/icons ios/ModernAge/www/
# The service worker is for browsers; WKWebView serves from the bundle, so it is intentionally omitted.
echo "Synced $(find ios/ModernAge/www -type f | wc -l | tr -d ' ') files into ios/ModernAge/www"
