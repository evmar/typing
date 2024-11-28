#!/bin/sh

set -e

npm run build
cp *.html *.png *.js deploy/
