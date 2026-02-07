---
name: deadline-monitor
description: Monitor case deadlines and limitation periods. Generate alerts for upcoming deadlines within 7/3/1 days. Auto-approved, low risk.
metadata: { "openclaw": { "emoji": "⏰", "always": true } }
---

# Deadline Monitor

Monitor case checklists and hearing dates for approaching deadlines. Generate alerts at 7, 3, and 1 day thresholds.

## Risk Level: LOW (auto-approved)

Read-only monitoring. Log every action via `logAction()` with `riskLevel: "low"`.

## Workflow

### 1. Scan All Cases

```typescript
const cases = await client.listCases();
// Filter for active cases (status != "closed" or "archived")
```

### 2. Check Each Case for Deadlines

For each active case:

```typescript
const caseDetail = await client.getCase(caseId);
const checklist = await client.getChecklist(caseId);
```

**Sources of deadlines:**

- `case.nextHearing` - Next court hearing date
- `checklistItem.dueDate` - Checklist item deadlines
- Case intelligence - Limitation periods, compliance dates

### 3. Classify Urgency

| Days Until Deadline | Urgency  | Action                               |
| ------------------- | -------- | ------------------------------------ |
| > 7 days            | Normal   | Include in weekly briefing           |
| 3-7 days            | Warning  | Log alert, include in daily briefing |
| 1-3 days            | Urgent   | Log urgent alert                     |
| 0-1 days            | Critical | Log critical alert                   |
| Overdue             | Overdue  | Log overdue alert with days past     |

### 4. Check Limitation Periods

For certain case types, calculate statutory limitation periods:

| Case Type          | Key Limitation                    | Section                       |
| ------------------ | --------------------------------- | ----------------------------- |
| Civil Suit         | 3 years from cause of action      | Limitation Act, Art. 113      |
| Appeal (decree)    | 30/90 days from order             | Limitation Act, Art. 116      |
| Consumer Complaint | 2 years from cause of action      | Consumer Protection Act, S.69 |
| Cheque Bounce      | 30 days from notice period expiry | NI Act, S.138                 |
| NCLT Application   | Varies by provision               | IBC/Companies Act             |

### 5. Report Alerts

```typescript
await client.logAction({
  actionType: "schedule",
  riskLevel: "low",
  description: "Deadline scan: [N] upcoming deadlines across [M] cases. [X] urgent.",
  toolsUsed: ["deadline-monitor"],
  modelUsed: currentModel,
  inputTokens,
  outputTokens,
  costUsd,
  status: "completed",
  metadata: {
    totalCases: cases.length,
    deadlinesFound: [
      {
        caseId,
        caseTitle: "Case Name",
        deadline: "2025-02-15",
        daysUntil: 3,
        urgency: "urgent",
        description: "Next hearing date",
      },
    ],
    overdue: [],
  },
});
```

## Scheduling

This skill should run as a daily cron job (recommended: early morning before work hours).

```
Schedule: 0 6 * * * (6:00 AM IST daily)
Task type: deadline_check
```

## Guidelines

- Never skip a case - scan all active cases every run
- Double-check date calculations (account for weekends/holidays if known)
- For court hearings, note the court's schedule if available
- Flag any case that hasn't had activity in 30+ days
- If a deadline has passed without the checklist item being marked complete, flag as overdue
- Use KIMI K2 for all deadline monitoring (no Claude needed)
