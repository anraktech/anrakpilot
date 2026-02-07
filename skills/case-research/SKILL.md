---
name: case-research
description: Research relevant case law, statutes, and legal precedents for active cases using Indian legal databases. Auto-approved, low risk.
metadata: { "openclaw": { "emoji": "🔍", "always": true } }
---

# Case Research

Research Indian case law, statutes, and legal precedents for the lawyer's active cases.

## Risk Level: LOW (auto-approved)

All actions are read-only research. Log every action via `logAction()` with `riskLevel: "low"`.

## Workflow

### 1. Identify Research Target

Use the AnrakLegal API client to understand context:

```typescript
const cases = await client.listCases();
// Pick the case needing research (from schedule trigger or user request)
const caseDetail = await client.getCase(caseId);
```

Review case intelligence, case type, court, and current status to determine research needs.

### 2. Search Existing Documents

Before external research, check what's already in the case:

```typescript
const results = await client.searchCaseDocuments(caseId, "relevant legal query", 10);
// Review chunks for existing case law references
```

### 3. External Research via Browser

Use Playwright to search Indian legal databases:

**Indian Kanoon** (primary - free):

- Navigate to `https://indiankanoon.org/search/?formInput={query}`
- Extract case citations, holdings, and relevant paragraphs
- Focus on Supreme Court and relevant High Court decisions

**SCC Online** (if accessible):

- Navigate to `https://www.scconline.com`
- Search by case number, party name, or legal topic

**eCourts** (government portal):

- Navigate to `https://ecourts.gov.in`
- Check case status, orders, cause lists

### 4. Analyze & Summarize

For each relevant case found:

- Extract citation (e.g., "AIR 2023 SC 1234" or "(2023) 5 SCC 456")
- Identify key holdings and ratio decidendi
- Note relevant statutory provisions cited
- Assess applicability to the lawyer's case

### 5. Report Results

Log the research action:

```typescript
await client.logAction({
  actionType: "research",
  riskLevel: "low",
  description: "Researched case law for [case title]: found [N] relevant precedents",
  toolsUsed: ["browser", "indian-kanoon"],
  modelUsed: currentModel,
  inputTokens,
  outputTokens,
  costUsd,
  status: "completed",
  caseId,
  metadata: {
    query: "search terms used",
    casesFound: ["citation1", "citation2"],
    databases: ["indiankanoon", "ecourts"],
  },
});
```

## Guidelines

- Always cite sources with full case citations
- Prefer Supreme Court decisions, then relevant High Court
- Note if a case has been overruled or distinguished
- For statutory research, cite the exact section and amendment year
- Do not fabricate citations - only report cases actually found in the database
- If no relevant precedent is found, report that clearly
- Use KIMI K2 for research; escalate to Claude only for complex analysis
