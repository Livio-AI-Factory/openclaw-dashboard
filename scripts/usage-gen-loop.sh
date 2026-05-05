#!/bin/bash
# Runs generate-usage.js every 5 minutes in a loop
while true; do
  cd /data/.openclaw/workspace/openclaw-dashboard
  node scripts/generate-usage.js >> /tmp/usage-gen.log 2>&1
  sleep 300
done
