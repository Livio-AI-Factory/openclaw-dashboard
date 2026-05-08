#!/usr/bin/env python3
"""Generate usage.json from OpenClaw session data — real data, runs on VPS."""

import json
import glob
import os
from datetime import datetime, timezone, timedelta

IST = timezone(timedelta(hours=5, minutes=30))

def get_week_start():
    now = datetime.now(IST)
    monday = now - timedelta(days=now.weekday())
    return monday.replace(hour=0, minute=0, second=0, microsecond=0)

def main():
    agents_dir = os.environ.get("OPENCLAW_AGENTS_DIR", "/data/.openclaw/agents")
    output_path = os.environ.get("OUTPUT_PATH", "public/data/usage.json")
    week_start = get_week_start()
    week_start_ms = int(week_start.timestamp() * 1000)
    
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
        
        total_input = total_output = total_runtime = 0
        total_cost = 0.0
        weekly_input = weekly_output = weekly_runtime = 0
        weekly_cost = 0.0
        admin_input = admin_output = 0
        admin_cost = 0.0
        weekly_admin_cost = 0.0
        last_active = ""
        session_count = 0
        admin_session_count = 0
        
        for k, v in data.items():
            if not isinstance(v, dict):
                continue
            
            # Detect admin/sub-agent sessions
            is_admin = 'subagent:' in k or 'admin' in k.lower()
            
            inp = v.get("inputTokens", 0) or 0
            out = v.get("outputTokens", 0) or 0
            rt = v.get("runtimeMs", 0) or 0
            cost = v.get("estimatedCostUsd", 0) or 0
            
            total_input += inp
            total_output += out
            total_runtime += rt
            total_cost += cost
            session_count += 1
            
            if is_admin:
                admin_input += inp
                admin_output += out
                admin_cost += cost
                admin_session_count += 1
                
                updated = v.get("updatedAt", 0)
                if updated and updated >= week_start_ms:
                    weekly_admin_cost += cost
            
            # Weekly check using updatedAt (epoch ms)
            updated = v.get("updatedAt", 0)
            if updated and updated >= week_start_ms:
                weekly_input += inp
                weekly_output += out
                weekly_runtime += rt
                weekly_cost += cost
            
            if str(updated) > last_active:
                last_active = str(updated)
        
        total_hours = round(total_runtime / 3600000, 1)
        weekly_hours = round(weekly_runtime / 3600000, 1)
        
        employees.append({
            "name": name,
            "agentId": agent,
            "tokensIn": total_input,
            "tokensOut": total_output,
            "totalTokens": total_input + total_output,
            "weeklyTokensIn": weekly_input,
            "weeklyTokensOut": weekly_output,
            "weeklyTokens": weekly_input + weekly_output,
            "estimatedHours": total_hours,
            "weeklyHours": weekly_hours,
            "totalCost": round(total_cost, 4),
            "weeklyCost": round(weekly_cost, 4),
            "adminCost": round(admin_cost, 4),
            "weeklyAdminCost": round(weekly_admin_cost, 4),
            "employeeCost": round(total_cost - admin_cost, 4),
            "weeklyEmployeeCost": round(weekly_cost - weekly_admin_cost, 4),
            "adminSessionCount": admin_session_count,
            "totalRuntimeMs": total_runtime,
            "weeklyRuntimeMs": weekly_runtime,
            "streak": 0,
            "lastActive": last_active,
            "sessionCount": session_count,
        })
    
    # Sort by weekly hours desc
    employees.sort(key=lambda x: x["weeklyHours"], reverse=True)
    for i, e in enumerate(employees):
        e["rank"] = i + 1
    
    total_admin_cost = sum(e["adminCost"] for e in employees)
    weekly_admin_cost_total = sum(e["weeklyAdminCost"] for e in employees)
    total_employee_cost = sum(e["employeeCost"] for e in employees)
    weekly_employee_cost_total = sum(e["weeklyEmployeeCost"] for e in employees)
    
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
            "totalWeeklyTokens": sum(e["weeklyTokens"] for e in employees),
            "totalCost": round(sum(e["totalCost"] for e in employees), 2),
            "weeklyCost": round(sum(e["weeklyCost"] for e in employees), 4),
            "adminCost": round(total_admin_cost, 2),
            "weeklyAdminCost": round(weekly_admin_cost_total, 4),
            "employeeCost": round(total_employee_cost, 2),
            "weeklyEmployeeCost": round(weekly_employee_cost_total, 4),
            "adminNote": "Admin costs include sub-agent operations, dashboard builds, PDF generation — not recurring employee usage"
        }
    }
    
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)
    
    print(f"✅ Generated usage data for {len(employees)} employees → {output_path}")

if __name__ == "__main__":
    main()
