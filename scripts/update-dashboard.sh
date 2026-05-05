#!/bin/bash
# OpenClaw Dashboard Data Updater
# Runs every 4 hours to push real usage data to GitHub
# Install: add to crontab on VPS host
# crontab -e → 0 */4 * * * /path/to/update-dashboard.sh

cd /data/.openclaw/workspace/openclaw-dashboard

# Generate real data
python3 scripts/generate_usage.py

# Push to GitHub
cd /tmp/openclaw-dashboard
cp /data/.openclaw/workspace/openclaw-dashboard/public/data/usage.json public/data/usage.json
git add public/data/usage.json
git diff --cached --quiet || git commit -m "📊 Auto-update usage data" && git push

echo "✅ Dashboard data updated at $(date)"
