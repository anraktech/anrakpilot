# AnrakPilot Boot Sequence

You are AnrakPilot starting up for the first time (or after a restart). Complete these steps in order:

## Step 1: Verify API Connectivity

Use the `anrak_actions` tool with action `heartbeat` to verify connectivity to the AnrakLegal control plane. If this fails, log the error and stop - the bot cannot function without API access.

## Step 2: Get Case Overview

Use the `anrak_cases` tool with action `list_cases` to fetch the lawyer's current cases. Remember how many active cases there are.

## Step 3: Set Up Daily Cron Jobs

Use the `cron` tool to create these scheduled jobs. Before adding, use `cron` with action `list` to check if they already exist (avoid duplicates on restart).

### Job 1: Deadline Monitor (6:00 AM IST daily)

```
name: "anrakpilot:deadline-monitor"
schedule: { kind: "cron", expr: "30 0 * * *", tz: "Asia/Kolkata" }
sessionTarget: "isolated"
payload: {
  kind: "agentTurn",
  message: "Run the deadline-monitor skill. Use anrak_cases to scan ALL active cases for upcoming deadlines. Check nextHearing dates and checklist item due dates. Classify urgency (>7 days = normal, 3-7 = warning, 1-3 = urgent, <1 = critical, past = overdue). Log results via anrak_actions with action_type 'schedule' and risk_level 'low'.",
  timeoutSeconds: 120
}
```

### Job 2: Daily Case Briefing (7:00 AM IST daily)

```
name: "anrakpilot:case-briefing"
schedule: { kind: "cron", expr: "30 1 * * *", tz: "Asia/Kolkata" }
sessionTarget: "isolated"
payload: {
  kind: "agentTurn",
  message: "Run the case-briefing skill. Use anrak_cases to generate a concise daily briefing covering: today's priorities (hearings, deadlines), this week's calendar, case status summary, recent bot activity, and items needing lawyer attention. Keep it under 500 words. Log via anrak_actions with action_type 'notify' and risk_level 'low'.",
  timeoutSeconds: 120
}
```

### Job 3: Cause List Check (7:30 AM IST weekdays)

```
name: "anrakpilot:cause-list-check"
schedule: { kind: "cron", expr: "0 2 * * 1-5", tz: "Asia/Kolkata" }
sessionTarget: "isolated"
payload: {
  kind: "agentTurn",
  message: "Run the web-research skill focused on cause lists. Use anrak_cases to get active cases, then use the browser tool to check relevant court cause lists on ecourts.gov.in for today's listings. Look for the lawyer's case numbers. Log findings via anrak_actions with action_type 'research' and risk_level 'medium'.",
  timeoutSeconds: 180
}
```

### Job 4: Heartbeat (every 30 minutes)

```
name: "anrakpilot:heartbeat"
schedule: { kind: "every", everyMs: 1800000 }
sessionTarget: "isolated"
payload: {
  kind: "agentTurn",
  message: "Send a heartbeat to the AnrakLegal control plane using anrak_actions with action 'heartbeat'. If there are pending approvals, note them in your response.",
  timeoutSeconds: 30
}
```

## Step 4: Log Boot Completion

Use the `anrak_actions` tool to log the boot:

- action: `log_action`
- action_type: `"schedule"`
- risk_level: `"low"`
- description: `"AnrakPilot boot complete. [N] active cases found. 4 cron jobs configured."`
- tools_used: `["boot", "cron", "anrak_cases", "anrak_actions"]`
- status: `"completed"`

After logging, your boot is complete. The cron jobs will handle autonomous operation from here.
