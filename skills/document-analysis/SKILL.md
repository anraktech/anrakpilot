---
name: document-analysis
description: Analyze legal documents uploaded to cases - extract key facts, dates, parties, obligations, and update case intelligence. Auto-approved, low risk.
metadata: { "openclaw": { "emoji": "📄", "always": true } }
---

# Document Analysis

Analyze legal documents attached to the lawyer's cases. Extract structured information and update case intelligence.

## Risk Level: LOW (auto-approved)

Read-only analysis of existing documents. Log every action via `logAction()` with `riskLevel: "low"`.

## Workflow

### 1. Fetch Documents

```typescript
const documents = await client.getCaseDocuments(caseId);
// Identify new or unanalyzed documents
```

### 2. Analyze Each Document

For each document, extract:

**Core Facts:**

- Parties involved (names, roles, designations)
- Key dates (filing, hearing, limitation, execution)
- Court and jurisdiction
- Case/file numbers referenced

**Legal Elements:**

- Cause of action or subject matter
- Relief sought or obligations created
- Statutory provisions cited
- Precedents referenced
- Conditions, warranties, or covenants

**Document-Specific Analysis:**

| Document Type        | Focus Areas                                       |
| -------------------- | ------------------------------------------------- |
| Petition/Application | Grounds, prayer, verification                     |
| Order/Judgment       | Operative part, directions, timelines             |
| Contract/Agreement   | Parties, term, consideration, termination clauses |
| Notice               | Trigger event, response deadline, consequences    |
| Affidavit            | Deponent, key admissions, exhibits                |
| Vakalatnama          | Authority scope, case details                     |

### 3. Semantic Search for Cross-References

```typescript
// Search existing case docs for related content
const related = await client.searchCaseDocuments(caseId, "key term from document", 5);
// Cross-reference findings with existing case intelligence
```

### 4. Report Findings

Log the analysis:

```typescript
await client.logAction({
  actionType: "analyze",
  riskLevel: "low",
  description: "Analyzed [document title]: [type] containing [summary]",
  toolsUsed: ["document-parser"],
  modelUsed: currentModel,
  inputTokens,
  outputTokens,
  costUsd,
  status: "completed",
  caseId,
  metadata: {
    documentId,
    documentType: "petition|order|contract|notice|affidavit|other",
    partiesFound: ["Party A", "Party B"],
    keyDates: [{ date: "2025-01-15", event: "Next hearing" }],
    statutesReferenced: ["CPC Section 151", "IPC Section 420"],
  },
});
```

## Guidelines

- Extract information faithfully - do not infer facts not present in the document
- Flag ambiguous or contradictory provisions
- Note missing information that should typically be present
- For multilingual documents (Hindi/English), process both languages
- Respect document confidentiality - never include full text in logs, only summaries
- Use the default model for standard analysis; use the advanced model for complex contracts or judgments
