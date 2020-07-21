#!/bin/sh

yarn build

cp package.json dist/

scp -r dist/* tx:/www/extractor/

ssh tx "cd /www/extractor && yarn install --production=true && pm2 restart extractor"