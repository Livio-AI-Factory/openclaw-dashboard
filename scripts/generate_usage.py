#!/usr/bin/env python3
"""Generate usage.json from OpenClaw session data for the dashboard."""

import json
import glob
import os
from datetime import datetime, timezone, timedelta

IST = timezone(timedelta(hours=5, minutes=30))

def get_week_start():
    """Get Monday of current week in IST."""
    now = datetime.now(IST)
    monday = now - timedelta(days=now.weekday())
    return monday.replace(hour=0, minute=0, second=0, microsecond=0)

def get_badge(hours):
    if hours >= 15: return {"name": "Champion", "icon": "🏆", "color": "#f59e0b", "bgColor": "#fffbeb"}
    if hours >= 10: return {"name": "Master", "icon": "🟣", "color": "#a855f7", "bgColor": "#faf5ff"}
    if hours >= 8:  return {"name": "Achiever", "icon": "🔵", "color": "#3b82f6", "bgColor": "#eff6ff"}
    if hours >= 5:  return {"name": "Explorer", "icon": "🟢", "color": "#22c55e", "bgColor": "#f0fdf4"}
    if hours >= 2:  return {"name": "Learner", "icon": "🟡", "color": "#eab308", "bgColor": "#fefce8"}
    return {"name": "Beginner", "icon": "🔴", "color": "#ef4444", "bgColor": "#fef2f2"}

def main():
    agents_dir = os.environ.get("OPENCLAW_AGENTS_DIR", "/data/.openclaw/agents")
    week_start = get_week_start()
    
    employees = []
    for sf in sorted(glob.glob(os.path.join(agents_dir, "*/sessions/sessions.json"))):
        agent = sf.split("/agents/")[1].split("/sessions")[0]
        if agent == "main":
            continue
        
        name = agent.replace("_workspace", "").replace("_", " ").title()
        
        try:
            with open(sf) as f:
                data = json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            continue
        
        total_in = total_out = 0
        weekly_in = weekly_out = 0
        last_active = ""
        
        for k, v in data.items():
            if not isinstance(v, dict):
                continue
            ti = v.get("tokensIn", 0) or 0
            to = v.get("tokensOut", 0) or 0
            total_in += ti
            total_out += to
            
            # Check if session was active this week
            updated = str(v.get("updatedAt", v.get("createdAt", "")))
            if updated:
                try:
                    dt = datetime.fromisoformat(updated.replace("Z", "+00:00"))
                    if dt.astimezone(IST) >= week_start:
                        weekly_in += ti
                        weekly_out += to
                except (ValueError, TypeError):
                    pass
            
            if updated > last_active:
                last_active = updated
        
        weekly_hours = round(weekly_out / 5000, 1)
        total_hours = round(total_out / 5000, 1)
        
        employees.append({
            "name": name,
            "agentId": agent,
            "tokensIn": total_in,
            "tokensOut": total_out,
            "totalTokens": total_in + total_out,
            "estimatedHours": total_hours,
            "weeklyHours": weekly_hours,
            "streak": 0,  # TODO: calculate from historical data
            "lastActive": last_active,
            "badge": get_badge(weekly_hours),
        })
    
    # Sort by weekly hours desc
    employees.sort(key=lambda x: x["weeklyHours"], reverse=True)
    for i, e in enumerate(employees):
        e["rank"] = i + 1
    
    output = {
        "employees": employees,
        "generatedAt": datetime.now(IST).isoformat(),
        "weekStart": week_start.isoformat(),
        "summary": {
            "totalEmployees": len(employees),
            "totalWeeklyHours": round(sum(e["weeklyHours"] for e in employees), 1),
            "avgWeeklyHours": round(sum(e["weeklyHours"] for e in employees) / max(len(employees), 1), 1),
            "goalMetCount": len([e for e in employees if e["weeklyHours"] >= 10]),
            "totalTokens": sum(e["totalTokens"] for e in employees),
        }
    }
    
    output_path = os.environ.get("OUTPUT_PATH", "public/data/usage.json")
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)
    
    print(f"Generated usage data for {len(employees)} employees")
    print(f"Output: {output_path}")

if __name__ == "__main__":
    main()
