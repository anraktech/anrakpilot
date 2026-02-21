---
name: checklist-manager
description: Review and manage case checklists - suggest new items based on case type, mark completed items when evidence is found. Medium risk, logged.
metadata: { "openclaw": { "emoji": "✅", "always": true } }
---

# Checklist Manager

Review case checklists for completeness, suggest new items based on case type and stage, and mark items as completed when supporting evidence is found in case documents.

## Risk Level: MEDIUM (logged, lawyer can review)

Writes to checklists. Log every action via `logAction()` with `riskLevel: "medium"`.

## Workflow

### 1. Review Current Checklist

```typescript
const caseDetail = await client.getCase(caseId);
const checklist = await client.getChecklist(caseId);
const documents = await client.getCaseDocuments(caseId);
```

### 2. Assess Completeness

Based on case type and current stage, check if standard procedural items are present:

**Civil Suit Checklist (typical):**

- [ ] Vakalatnama filed
- [ ] Plaint/petition drafted and filed
- [ ] Court fee paid
- [ ] Affidavit of service
- [ ] Written statement (if defendant)
- [ ] Document list (Exhibit list)
- [ ] Issues framed
- [ ] Evidence affidavit
- [ ] Arguments prepared

**Criminal Case Checklist (typical):**

- [ ] FIR copy obtained
- [ ] Bail application (if applicable)
- [ ] Charge sheet reviewed
- [ ] Witness list prepared
- [ ] Cross-examination questions
- [ ] Final arguments

**Consumer Complaint (typical):**

- [ ] Complaint drafted
- [ ] Supporting documents compiled
- [ ] Notice to opposite party (30 days)
- [ ] Affidavit of complainant
- [ ] Evidence compilation

### 3. Suggest New Items

If standard items are missing for the case type and stage, suggest them. Do NOT auto-add - log the suggestion for the lawyer to review.

### 4. Auto-Complete with Evidence

Search case documents to verify if checklist items are already done:

```typescript
// For each incomplete checklist item:
const evidence = await client.searchCaseDocuments(caseId, checklistItem.text, 3);
if (evidence.chunks.length > 0 && evidence.chunks[0].score > 0.8) {
  // Strong evidence found - mark as completed
  await client.updateChecklistItem(caseId, itemId, { completed: true });
}
```

### 5. Report Changes

```typescript
await client.logAction({
  actionType: "analyze",
  riskLevel: "medium",
  description:
    "Checklist review for [case title]: [N] items checked, [M] auto-completed, [P] new suggestions",
  toolsUsed: ["checklist-manager"],
  modelUsed: currentModel,
  inputTokens,
  outputTokens,
  costUsd,
  status: "completed",
  caseId,
  metadata: {
    itemsReviewed: checklist.length,
    autoCompleted: ["item1", "item2"],
    suggestions: ["Suggested item 1", "Suggested item 2"],
    evidenceLinks: { itemId: "documentTitle with matching content" },
  },
});
```

## Guidelines

- Only auto-complete items when document evidence score > 0.8
- For ambiguous matches, log the suggestion but don't auto-complete
- Respect case type - don't suggest criminal procedure items for civil cases
- Consider the court and jurisdiction when suggesting procedural steps
- Never remove or un-check an item the lawyer has marked as complete
- Use the default model for standard reviews
