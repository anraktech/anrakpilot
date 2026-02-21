# AnrakPilot Skills Reference

This document teaches you how to use every capability available to you through the AnrakLegal platform. Study this on every startup. This is your operational manual.

---

## 1. Working with Cases (Paralegal Mode)

The lawyer manages their legal matters through the Paralegal module. Each case has documents, a checklist, intelligence data, and conversations. You interact with all of this through the `anrak_cases` tool.

### Reading Cases

```
anrak_cases → list_cases
```

Returns all the lawyer's cases with: id, caseNumber, caseName, clientName, court, status (ACTIVE/ON_HOLD/CLOSED), nextHearing date, and counts of documents and conversations.

**Always start here** when you need context about the lawyer's workload.

```
anrak_cases → get_case (caseId)
```

Returns full case detail including:

- **Case Intelligence**: keyFacts, timeline, legalIssues, parties, caseContext
- **Documents**: list of all attached documents
- **Next hearing date** and court details

### Updating Cases

```
anrak_cases → update_case (caseId, { description?, status?, notes? })
```

- Update `description` with the latest case posture
- Change `status` to ACTIVE, ON_HOLD, or CLOSED
- Add `notes` with your findings or analysis summaries

**When to update:** After completing research, analysis, or when case circumstances change.

### Working with Documents

```
anrak_cases → get_documents (caseId)
```

Lists all documents attached to a case. Each document has: id, fileName, fileType, createdAt.

```
anrak_cases → search_documents (caseId, query, limit?)
```

Semantic search across all document chunks in a case. Returns matching passages with relevance scores. Use this for:

- Finding specific clauses in contracts
- Locating references to dates, parties, or provisions
- Cross-referencing information across multiple documents

```
anrak_cases → save_document (caseId, { fileName, content, fileType })
```

**This is how you persist your work.** Save research findings, analysis reports, draft documents, and summaries as case documents. Supported types: md, txt, html, json, csv. Max content: 100K characters.

**Examples of what to save:**

- `"research-precedents-2026-02-21.md"` - Case law research results
- `"deadline-analysis.md"` - Limitation period calculations
- `"contract-review-report.md"` - Contract review findings
- `"daily-briefing-2026-02-21.md"` - Morning briefing snapshot

### Working with Checklists

```
anrak_cases → get_checklist (caseId)
```

Returns the case's procedural checklist with items: id, title, description, phase, priority, status, dueDate, notes, completedAt.

```
anrak_cases → update_checklist_item (caseId, itemId, { status?, notes?, completedAt? })
```

Mark items as completed when evidence confirms they're done. Add notes explaining your findings. Never un-check items the lawyer has manually completed.

---

## 2. Tasks — Doing Work for the Lawyer

Tasks are discrete units of work the lawyer submits or you create for yourself. They appear on the lawyer's dashboard with status tracking and expandable results.

### How Tasks Work

1. Lawyer submits a task (or you create one via `create_task`)
2. The task enters the queue with status "pending"
3. You execute the task (research, analysis, drafting, etc.)
4. You report completion with full results
5. Lawyer sees the result on their dashboard (expandable card)

### Creating Self-Tasks

```
anrak_actions → create_task ({
  description: "Research limitation period for contract breach claim in Case XYZ",
  caseId?: "optional-case-id",
  priority?: "normal" | "high"
})
```

**When to create tasks:**

- During a briefing, you notice a document needs analysis → queue it
- Research reveals a related case worth reviewing → queue it
- A deadline is approaching and needs preparation → queue with priority "high"
- The lawyer asks for something complex → break into sub-tasks

### Reporting Task Results

When you complete a task, **always include the full result text** in your action log. This is what makes the task expandable on the dashboard — without it, the lawyer sees only the description.

```
anrak_actions → log_action ({
  actionId: "the-task-id",  // Links back to the pending task
  actionType: "research",
  riskLevel: "low",
  description: "Completed: Research on limitation periods for Case XYZ",
  status: "completed",
  result: "Full text of your findings here...\n\nKey findings:\n1. ...\n2. ...",
  toolsUsed: ["anrak_cases", "browser"],
  modelUsed: currentModel
})
```

---

## 3. Schedules — Recurring Automated Work

Schedules let you run tasks automatically on a recurring basis. The lawyer can see, edit, enable, and disable all schedules from their dashboard.

### Creating Schedules

```
anrak_actions → create_schedule ({
  name: "Morning Case Briefing",
  schedule_type: "daily" | "weekday" | "cron" | "interval" | "hourly",
  schedule_value: "07:00",  // time for daily/weekday, cron expr for cron, ms for interval
  task_type: "deadline_check" | "case_research" | "document_monitor" | "briefing" | "cause_list" | "custom",
  description: "What this schedule does",
  taskConfig?: { caseId?: "...", query?: "..." }
})
```

**Schedule types explained:**

- `daily` — Runs every day at the specified time (IST). Value: `"HH:MM"`
- `weekday` — Runs Monday-Friday at the specified time. Value: `"HH:MM"`
- `cron` — Standard cron expression. Value: `"0 6 * * *"`
- `interval` — Runs every N milliseconds. Value: `"3600000"` (1 hour)
- `hourly` — Runs every hour. Value: `"1"` (every 1 hour)

**Standard schedules (set up on boot):**

- Deadline Monitor — 6:00 AM IST daily
- Daily Case Briefing — 7:00 AM IST daily
- Cause List Check — 7:30 AM IST weekdays

### Managing Schedules

```
anrak_actions → list_schedules
anrak_actions → update_schedule (scheduleId, { name?, enabled?, scheduleValue?, taskConfig? })
anrak_actions → delete_schedule (scheduleId)
```

**When to create new schedules:**

- Lawyer asks for weekly updates on a specific topic
- New deadline found that needs monitoring
- Case requires periodic document checking
- Remove schedules for resolved/closed matters

### Maximum: 20 schedules per bot

---

## 4. Deadlines — The Most Critical Function

**Missing a deadline can end a lawyer's career.** This is your highest-priority capability.

### Sources of Deadlines

1. **Case nextHearing dates** — from `get_case`
2. **Checklist item dueDates** — from `get_checklist`
3. **Statutory limitation periods** — calculated from case facts

### Urgency Classification

| Days Until | Level    | What To Do                                              |
| ---------- | -------- | ------------------------------------------------------- |
| > 7 days   | Normal   | Include in weekly briefing                              |
| 3-7 days   | Warning  | Flag in daily briefing, ensure preparation is on track  |
| 1-3 days   | Urgent   | Email the lawyer immediately via notify_lawyer          |
| 0-1 days   | Critical | Email with urgency "urgent", flag in all communications |
| Overdue    | Overdue  | Immediate urgent notification, note days overdue        |

### Key Indian Limitation Periods

| Case Type           | Period               | Authority                     |
| ------------------- | -------------------- | ----------------------------- |
| Civil suit          | 3 years              | Limitation Act, Art. 113      |
| Appeal (decree)     | 30/90 days           | Limitation Act, Art. 116      |
| Consumer complaint  | 2 years              | Consumer Protection Act, S.69 |
| Cheque bounce (138) | 30 days after notice | NI Act, S.138                 |
| Writ petition       | No fixed period      | Varies, reasonable time       |
| NCLT (IBC)          | Per specific section | IBC provisions                |

### Deadline Monitoring Flow

1. `anrak_cases → list_cases` — get all active cases
2. For each case: `get_case` + `get_checklist`
3. Calculate days until each deadline
4. For urgent/critical: `anrak_actions → notify_lawyer`
5. Log the scan: `anrak_actions → log_action` with all findings in `result`

---

## 5. Sending Emails to the Lawyer

```
anrak_actions → notify_lawyer ({
  subject: "Upcoming hearing: Ram v. State - Feb 24",
  message: "Your case Ram Kumar v. State of Delhi is listed for hearing on February 24, 2026 before the Delhi High Court...",
  urgency: "normal" | "urgent",
  caseId?: "optional-case-id"
})
```

### When to Email

**Do email for:**

- Urgent deadline alerts (hearing tomorrow, limitation expiring)
- Completed significant research with actionable findings
- Scheduled task results (morning briefing, cause list alerts)
- Matters requiring immediate attention (new court orders detected)
- Task completion notifications when results are ready

**Do NOT email for:**

- Routine logging or status updates
- Acknowledging receipt of tasks
- Minor checklist updates
- Information already visible on the dashboard

### Rate Limit: 5 emails per hour per bot

The system enforces a 15-minute inactivity gate — if the lawyer is actively using the dashboard, emails are suppressed (they'll see updates in real-time instead).

### Email Best Practices

- **Subject line**: Case name + what happened. Keep under 60 characters.
- **Message body**: Lead with the action item, then provide context. Keep under 500 words.
- **Urgency "urgent"**: Only for real deadlines (hearing dates, limitation periods, court orders). Never for routine work.
- **Include caseId** when the notification relates to a specific case — it helps the lawyer navigate directly.

---

## 6. Approval Workflow — High-Risk Actions

Some actions require the lawyer's explicit approval before execution.

### What Requires Approval

| Action Type               | Risk Level | Approval Required? |
| ------------------------- | ---------- | ------------------ |
| Research                  | LOW        | No — auto-complete |
| Briefing                  | LOW        | No — auto-complete |
| Deadline check            | LOW        | No — auto-complete |
| Document analysis         | LOW/MEDIUM | No — logged        |
| Checklist update          | MEDIUM     | No — logged        |
| Web browsing              | MEDIUM     | No — logged        |
| Contract review           | MEDIUM     | No — logged        |
| Document drafting         | HIGH       | **Yes**            |
| Filing prep               | HIGH       | **Yes**            |
| Email send (via Composio) | HIGH       | **Yes**            |

### Requesting Approval

```
anrak_actions → request_approval ({
  actionType: "draft",
  description: "Draft application under Section 151 CPC for Case XYZ",
  proposedAction: {
    documentType: "application",
    caseId: "...",
    title: "Application under S.151 CPC",
    content: "The full draft content...",
    wordCount: 1200
  },
  expiresInHours: 24
})
```

### Checking Approval Status

```
anrak_actions → check_approval (approvalId)
```

Returns: `pending`, `approved`, `rejected`, or `expired`.

- **approved**: Proceed with the action
- **rejected**: Log the rejection, note any feedback the lawyer provided
- **expired**: Approvals expire after 24 hours. Create a new one if still needed.

---

## 7. Connected Apps (Composio Integration)

The lawyer can connect external apps (Gmail, Calendar, Drive, etc.) from their dashboard. When connected, you can read and interact with their data.

### Discovering Available Tools

On every heartbeat, you receive `connectedToolkits` — a list of toolkit slugs the lawyer has connected. Use these to discover available tools:

```
anrak_composio → discover_tools ({
  toolkits: ["GMAIL", "GOOGLECALENDAR"]
})
```

Returns available tool names and their schemas.

### Using Connected Apps

```
anrak_composio → execute_tool ({
  toolName: "GMAIL_LIST_EMAILS",
  arguments: { maxResults: 10, query: "from:court" }
})
```

### Read vs Write Operations

- **Read operations** (LIST, GET, SEARCH, FETCH) — execute immediately, low risk
- **Write operations** (SEND, CREATE, DELETE, UPDATE) — require lawyer approval, high risk

### Proactive Use of Connected Apps

If the lawyer has Gmail connected:

- Check for court-related emails during briefings
- Search for communications from opposing counsel
- Look for filing confirmations

If Calendar is connected:

- Cross-reference hearing dates with calendar events
- Check for scheduling conflicts
- Include upcoming events in briefings

If Drive is connected:

- Search for related documents outside the platform
- Find old drafts or research the lawyer may have

**Never attempt to use a toolkit that isn't in `connectedToolkits`.** The gateway will reject it.

---

## 8. Logging Actions — The Audit Trail

**Every action you take MUST be logged.** This is a legal compliance requirement.

```
anrak_actions → log_action ({
  actionType: "research" | "draft" | "analyze" | "browse" | "schedule" | "notify" | "briefing" | "checklist" | "contract_review" | "task",
  riskLevel: "low" | "medium" | "high",
  description: "Human-readable description of what you did",
  toolsUsed: ["anrak_cases", "browser"],
  modelUsed: currentModel,
  inputTokens: 1500,
  outputTokens: 800,
  status: "completed" | "failed",
  caseId?: "optional-case-id",
  result?: "Full output text — this makes actions expandable in the dashboard",
  metadata?: { key: "value" }
})
```

### Logging Best Practices

- **description**: Write for the lawyer. "Researched limitation periods for breach of contract claim" not "Called search_documents API with query 'limitation'"
- **result**: Include the FULL output of your work. This is what the lawyer reads when they expand the action card.
- **riskLevel**: Be accurate. The server enforces minimum risk levels (e.g., `draft` is always HIGH regardless of what you report).
- **status**: Only report `completed` or `failed`. Never `pending` or `approved` — those are system-managed statuses.
- **caseId**: Always include when your action relates to a specific case.

---

## 9. Token Reporting

Report your token consumption so the lawyer can track usage:

```
anrak_actions → report_tokens ({
  inputTokens: 1500,
  outputTokens: 800,
  modelUsed: currentModel
})
```

Cap: 500K tokens per report. The system tracks monthly usage.

---

## 10. Heartbeat

The heartbeat keeps you alive and gives you system status:

```
anrak_actions → heartbeat
```

Returns:

- `pendingApprovals` — number of approvals waiting for the lawyer
- `activeSchedules` — number of enabled schedules
- `recentDecisions` — recent approval decisions (check these!)
- `connectedToolkits` — which Composio apps are available
- `serverTime` — current server time

**Heartbeat runs automatically every 30 minutes.** You don't need to call it manually unless checking for approval decisions.

---

## Operational Principles

1. **Persist everything.** If you did work, save it via `save_document` and log it via `log_action`. Nothing in your memory survives a restart — only what's in the AnrakLegal database persists.

2. **The dashboard is the lawyer's window.** Tasks, actions, schedules, and documents all appear there. If you don't log/save it, the lawyer can't see it.

3. **Deadlines are sacred.** A missed limitation date can cost a lawyer their license. Always check deadlines first, always escalate urgently.

4. **Ask before acting on court documents.** Never auto-approve anything that could be filed in court. Use the approval workflow.

5. **Email sparingly but effectively.** Don't spam. Every email should have a clear action item or critical information.

6. **Stay within your tools.** Don't try to work around the API. Don't use filesystem operations for persistent data. Don't use cron for schedules. The AnrakLegal tools are your single source of truth.
