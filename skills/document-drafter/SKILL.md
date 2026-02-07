---
name: document-drafter
description: Draft legal documents (applications, petitions, notices, affidavits). HIGH RISK - always requires lawyer approval before finalization. Uses Claude for drafting.
metadata: { "openclaw": { "emoji": "📝", "always": true } }
---

# Document Drafter

Draft legal documents for the lawyer's cases. All drafts require explicit lawyer approval.

## Risk Level: HIGH (requires lawyer approval)

**CRITICAL: Every document draft MUST go through the approval workflow. Never auto-approve drafts.**

## Model Selection

**Always use Claude (Sonnet or Opus) for document drafting.** KIMI K2 is not suitable for generating legal documents that may be filed in court. Switch model before drafting:

- Standard documents (notices, applications): Claude Sonnet 4.5
- Complex documents (petitions, appeals, detailed affidavits): Claude Opus 4.6

## Workflow

### 1. Gather Context

```typescript
const caseDetail = await client.getCase(caseId);
const documents = await client.getCaseDocuments(caseId);
const checklist = await client.getChecklist(caseId);

// Search for relevant templates and precedents
const context = await client.searchCaseDocuments(caseId, "relevant context query", 10);
```

### 2. Determine Document Type

| Type              | Template Elements                                          |
| ----------------- | ---------------------------------------------------------- |
| Application (CPC) | Case title, court, section, grounds, prayer                |
| Petition (Writ)   | Petitioner details, respondent, fundamental rights, prayer |
| Written Statement | Preliminary objections, para-wise reply, additional plea   |
| Notice (Legal)    | Sender, addressee, facts, demand, consequence, timeline    |
| Affidavit         | Deponent, verification, notarization block                 |
| Vakalatnama       | Advocate details, authority scope, case particulars        |
| Bail Application  | FIR details, grounds, sureties, conditions                 |
| Appeal Memo       | Impugned order, grounds, prayer                            |

### 3. Draft the Document

Follow Indian legal drafting conventions:

- **Court Header**: Full court name, case type, case number, year
- **Title**: Parties with proper descriptions
- **Body**: Numbered paragraphs with clear legal language
- **Prayer**: Specific relief sought
- **Verification**: Place, date, deponent
- **Advocate Details**: Name, enrollment number, address

**Language**: Default to English unless the lawyer's preference or court requires Hindi/regional language.

### 4. Request Approval

```typescript
const approval = await client.requestApproval({
  actionType: "document_draft",
  description: "Draft [document type] for [case title]: [brief summary of content]",
  proposedAction: {
    documentType: "application",
    caseId,
    title: "Application under Section 151 CPC",
    content: draftedContent,
    wordCount: content.split(/\s+/).length,
  },
  expiresInMs: 24 * 60 * 60 * 1000, // 24 hours
});
```

### 5. Log the Action

```typescript
await client.logAction({
  actionType: "draft",
  riskLevel: "high",
  description: "Drafted [document type] for [case title] - pending lawyer approval",
  toolsUsed: ["document-drafter"],
  modelUsed: "anthropic/claude-sonnet-4-5", // Always Claude
  inputTokens,
  outputTokens,
  costUsd,
  status: "pending_approval",
  caseId,
  metadata: {
    documentType: "application",
    approvalId: approval.id,
    wordCount: 1200,
    sectionsReferenced: ["CPC S.151", "Order VI Rule 17"],
  },
});
```

### 6. Wait for Approval

Do not proceed further with this document until the lawyer approves or rejects.

```typescript
// Check periodically or on next heartbeat
const status = await client.checkApproval(approval.id);
if (status.status === "approved") {
  // Lawyer approved - log completion
} else if (status.status === "rejected") {
  // Lawyer rejected - log rejection, note feedback if provided
}
```

## Document Quality Standards

- Use proper legal terminology and formatting
- Cite relevant statutory provisions with section numbers
- Include all mandatory elements for the document type
- Follow the specific court's practice directions if known
- Add "DRAFT - FOR REVIEW" watermark in metadata
- Include disclaimer: "This document was AI-assisted and requires lawyer review"

## Guidelines

- NEVER finalize or file a document without lawyer approval
- NEVER fabricate case citations in drafts
- If unsure about a legal requirement, note it as "[VERIFY: specific point]"
- Maintain consistent formatting throughout the document
- Respect the lawyer's prior drafting style if samples are available in case documents
- For urgent documents, note the urgency in the approval request description
