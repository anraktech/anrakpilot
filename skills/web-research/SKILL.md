---
name: web-research
description: Browse legal databases, government sites, court cause lists, and legal news using Playwright. Medium risk, logged and sandboxed.
metadata: { "openclaw": { "emoji": "🌐", "always": true } }
---

# Web Research

Use Playwright to browse legal databases, government portals, and court websites for case-relevant information.

## Risk Level: MEDIUM (logged, sandboxed browsing)

All browsing is sandboxed within the container. Log every action via `logAction()` with `riskLevel: "medium"`.

## Allowed Domains

Only browse these categories of sites:

**Court Portals:**

- `ecourts.gov.in` - eCourts Services (case status, cause lists, orders)
- `sci.gov.in` - Supreme Court of India
- `delhihighcourt.nic.in`, `bombayhighcourt.nic.in`, etc. - High Courts
- `njdg.ecourts.gov.in` - National Judicial Data Grid

**Legal Databases:**

- `indiankanoon.org` - Free case law search
- `scconline.com` - SCC Online (if credentials available)
- `manupatra.com` - Manupatra (if credentials available)

**Government & Regulatory:**

- `legislative.gov.in` - Acts and legislation
- `egazette.gov.in` - Government gazette notifications
- `mca.gov.in` - Ministry of Corporate Affairs (company filings)
- `rbi.org.in` - RBI circulars and regulations
- `sebi.gov.in` - SEBI regulations

**Legal News:**

- `livelaw.in` - Legal news
- `barandbench.com` - Legal news
- `scobserver.in` - Supreme Court Observer

**Do NOT browse:** Social media, email, messaging platforms, non-legal sites, or any site requiring the lawyer's personal credentials.

## Workflow

### 1. Navigate to Target

```typescript
// Use Playwright to navigate
await page.goto("https://indiankanoon.org/search/?formInput=specific+legal+query");
```

### 2. Extract Information

For each page visited:

- Extract relevant text content
- Note the URL and access timestamp
- Capture structured data (case numbers, dates, parties)

### 3. Court Cause List Monitoring

Check daily cause lists for the lawyer's upcoming cases:

```typescript
// Navigate to relevant court's cause list
// Search for case numbers from the lawyer's active cases
// Extract hearing date, bench, item number
```

### 4. Order/Judgment Downloads

When new orders are found:

- Extract the order text
- Note the date and bench
- Log the finding for the lawyer's review

### 5. Report Findings

```typescript
await client.logAction({
  actionType: "research",
  riskLevel: "medium",
  description: "Web research: browsed [N] pages across [sites]. Found [summary]",
  toolsUsed: ["browser", "playwright"],
  modelUsed: currentModel,
  inputTokens,
  outputTokens,
  costUsd,
  status: "completed",
  caseId,
  metadata: {
    pagesVisited: [{ url: "https://indiankanoon.org/...", title: "Case Name", extracted: true }],
    findings: "Brief summary of what was found",
    newOrders: [],
    causeListEntries: [],
  },
});
```

## Scheduling

Recommended daily cron jobs:

- Cause list check: `0 7 * * 1-5` (7 AM IST, weekdays)
- Legal news scan: `0 8 * * *` (8 AM IST daily)

## Guidelines

- Respect `robots.txt` and rate limits on all sites
- Do not attempt login with the lawyer's credentials
- Cache results to avoid redundant page loads
- If a site is down or blocked, log the failure and move on
- Extract text content only - do not download large files without logging
- Use the default model for web research tasks
- Maximum 20 pages per research session to control costs
