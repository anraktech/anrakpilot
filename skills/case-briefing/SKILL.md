---
name: case-briefing
description: Generate daily morning briefings for the lawyer - summarize overnight changes, upcoming deadlines, case status, and action items. Auto-approved, low risk.
metadata: { "openclaw": { "emoji": "📋", "always": true } }
---

# Case Briefing

Generate a concise daily briefing for the lawyer covering all active cases, deadlines, recent activity, and action items.

## Risk Level: LOW (auto-approved)

Read-only aggregation. Log every action via `logAction()` with `riskLevel: "low"`.

## Scheduling

Run as a daily cron job before the lawyer's work hours:

```
Schedule: 0 7 * * * (7:00 AM IST daily, after deadline monitor)
Task type: briefing
```

## Workflow

### 1. Gather All Case Data

```typescript
const cases = await client.listCases();
const briefingData = [];

for (const c of cases.filter((c) => c.status !== "closed")) {
  const detail = await client.getCase(c.id);
  const checklist = await client.getChecklist(c.id);
  briefingData.push({ case: detail, checklist });
}
```

### 2. Build Briefing Sections

**Section 1: Today's Priorities**

- Cases with hearings today or tomorrow
- Overdue checklist items
- Pending approvals requiring attention

**Section 2: This Week's Calendar**

- Upcoming hearings (next 7 days)
- Checklist deadlines (next 7 days)
- Scheduled bot tasks

**Section 3: Case Status Summary**

For each active case, one line:

```
[Case Number] [Title] - Status: [status] | Next: [hearing/deadline] | Items: [done/total]
```

**Section 4: Recent Bot Activity**

- Actions completed since last briefing
- Research findings summary
- Documents analyzed
- Checklist items auto-completed

**Section 5: Attention Required**

- Items needing lawyer approval
- Cases with no activity in 14+ days
- Approaching limitation periods

### 3. Format the Briefing

Keep it concise - lawyers are busy. Target: under 500 words.

```
=== DAILY BRIEFING | [Date] ===

PRIORITIES TODAY:
• [Case] - Hearing at [Court], [Time]
• [Case] - Filing deadline tomorrow

THIS WEEK:
• Mon: [Case] hearing
• Wed: [Case] written statement due
• Fri: [Case] evidence deadline

CASES ([N] active):
1. [CaseNum] Smith v. Jones - Next hearing: Feb 15 | Checklist: 8/12
2. [CaseNum] State v. Kumar - Bail hearing: Feb 12 | Checklist: 5/7
...

BOT ACTIVITY (last 24h):
• Analyzed 3 new documents in [Case]
• Found 2 relevant precedents for [Case]
• Updated checklist: 4 items auto-completed

ACTION REQUIRED:
• Review draft notice in [Case] (pending since Feb 10)
• 2 pending approvals awaiting your response
```

### 4. Log the Briefing

```typescript
await client.logAction({
  actionType: "notify",
  riskLevel: "low",
  description:
    "Daily briefing generated: [N] active cases, [M] priorities, [P] items needing attention",
  toolsUsed: ["case-briefing"],
  modelUsed: currentModel,
  inputTokens,
  outputTokens,
  costUsd,
  status: "completed",
  metadata: {
    briefingDate: new Date().toISOString().split("T")[0],
    activeCases: cases.length,
    todayHearings: 1,
    weekDeadlines: 3,
    pendingApprovals: 2,
    briefingWordCount: 350,
  },
});
```

## Guidelines

- Keep the briefing concise and scannable
- Prioritize by urgency: today > this week > informational
- Don't repeat information already visible in the dashboard
- If no significant updates, keep the briefing very short
- Use plain language, not legal jargon, for the briefing format
- Use the default model for briefing generation
- If this is the first briefing (no prior activity), focus on case overview and upcoming deadlines
