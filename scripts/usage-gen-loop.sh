#!/bin/bash
# Runs generate-usage.js AND guardian monitor + fixer every 5 minutes
while true; do
  cd /data/.openclaw/workspace/openclaw-dashboard
  node scripts/generate-usage.js >> /tmp/combined-loop.log 2>&1
  cd /data/.openclaw/guardian
  python3 monitor.py >> /data/.openclaw/guardian/guardian.log 2>&1
  python3 fixer.py >> /data/.openclaw/guardian/fixer.log 2>&1
  cd /data/.openclaw/workspace/openclaw-dashboard
  node scripts/generate-usage.js >> /tmp/combined-loop.log 2>&1
  sleep 300
done
