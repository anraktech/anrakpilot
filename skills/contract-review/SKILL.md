---
name: contract-review
description: Review contracts against playbooks - flag risky clauses, missing provisions, and suggest improvements. Medium risk, requires review. Uses advanced model for analysis.
metadata: { "openclaw": { "emoji": "📑", "always": true } }
---

# Contract Review

Review contracts and agreements against standard playbooks. Flag risky clauses, missing provisions, and suggest improvements.

## Risk Level: MEDIUM (logged, pending lawyer review)

Analysis output requires lawyer review before any action. Log every action via `logAction()` with `riskLevel: "medium"`.

## Model Selection

**Use the advanced model for contract review.** Legal analysis requires high accuracy.

For complex multi-party agreements or high-value contracts, use the most capable available model.

## Playbooks

Use the appropriate playbook based on contract type:

| Contract Type      | Playbook          | Key Focus                                 |
| ------------------ | ----------------- | ----------------------------------------- |
| General Commercial | indian-general    | Standard commercial terms                 |
| Vendor/Supply      | indian-vendor     | Payment terms, warranties, liability caps |
| Employment         | indian-employment | Non-compete, IP assignment, termination   |
| NDA                | indian-nda        | Scope, duration, exceptions, remedies     |
| Service Agreement  | indian-service    | SLA, deliverables, indemnification        |
| SaaS/Technology    | indian-saas       | Data protection, uptime, licensing        |

## Workflow

### 1. Fetch Contract Document

```typescript
const documents = await client.getCaseDocuments(caseId);
// Identify the contract document to review
const contract = documents.find((d) => d.fileType === "pdf" || d.fileType === "docx");
```

### 2. Extract Contract Structure

Parse the contract into sections:

- Preamble and definitions
- Operative clauses
- Representations and warranties
- Indemnification
- Limitation of liability
- Termination
- Dispute resolution
- Governing law
- Schedules and annexures

### 3. Apply Playbook Review

For each section, check against the playbook:

**Red Flags (must flag):**

- Unlimited liability exposure
- One-sided indemnification
- Auto-renewal without notice
- Unilateral termination rights
- Non-compete exceeding 1 year (Indian law)
- Penalty clauses (Section 74 Indian Contract Act)
- Jurisdiction outside India (for domestic contracts)
- Missing Force Majeure clause
- No data protection provisions (where applicable)

**Yellow Flags (recommend review):**

- Broad definition of confidential information
- Liquidated damages without reasonable estimate
- IP assignment without adequate consideration
- Exclusion of consequential damages
- Arbitration venue inconvenience
- Governing law mismatch

**Missing Provisions (suggest additions):**

- No limitation of liability cap
- No dispute resolution mechanism
- No notice provisions
- No assignment restrictions
- No amendment procedure
- Missing severability clause

### 4. Generate Review Report

Structure the output as:

```
CONTRACT REVIEW REPORT
======================
Document: [Title]
Type: [Contract type]
Playbook: [Playbook used]
Parties: [Party A] / [Party B]
Date: [Contract date]
Review Date: [Today]

RISK SCORE: [Low/Medium/High/Critical]

RED FLAGS ([N]):
1. Clause [X.Y]: [Issue description]
   Risk: [Explanation]
   Recommendation: [Suggested change]

YELLOW FLAGS ([N]):
1. Clause [X.Y]: [Issue description]
   Note: [Explanation]

MISSING PROVISIONS ([N]):
1. [Provision]: [Why it should be included]

SUMMARY:
[2-3 sentence overall assessment]
```

### 5. Log the Review

```typescript
await client.logAction({
  actionType: "analyze",
  riskLevel: "medium",
  description:
    "Contract review for [case title]: [contract type], Risk score: [score], [N] red flags, [M] yellow flags",
  toolsUsed: ["contract-review"],
  modelUsed: "anthropic/claude-sonnet-4-5",
  inputTokens,
  outputTokens,
  costUsd,
  status: "completed",
  caseId,
  metadata: {
    documentId,
    contractType: "vendor",
    playbook: "indian-vendor",
    riskScore: "medium",
    redFlags: 3,
    yellowFlags: 5,
    missingProvisions: 2,
    parties: ["Company A", "Company B"],
  },
});
```

## Guidelines

- Always identify both parties and their roles (drafter vs. counterparty)
- Review from the perspective of the lawyer's client
- Cite specific clause numbers in all findings
- Reference relevant Indian statutes (Indian Contract Act, IT Act, DPDP Act, etc.)
- Flag clauses that may be void under Indian law (Section 23, Indian Contract Act)
- Note if any clause conflicts with mandatory statutory provisions
- Do not suggest changes that would make the contract unenforceable
- For employment contracts, check compliance with state-specific Shops & Establishments Acts
- For technology contracts, check DPDP Act 2023 compliance
