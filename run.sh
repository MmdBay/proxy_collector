#!/bin/zsh

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm use 20.5.0

echo "Running pre-execution tasks..."

node /root/proxy/server.js

nvm use 14.20.0
pm2 stop run
