/**
 * AnrakLegal API Client
 *
 * Used by each AnrakPilot bot container to communicate with the
 * AnrakLegal control plane. Handles:
 * - Fetching lawyer's cases, documents, checklists
 * - Logging actions and reporting token usage
 * - Requesting approvals for high-risk actions
 * - Heartbeat for health monitoring
 */

export type AnrakLegalClientConfig = {
  /** AnrakLegal API base URL (e.g., https://anrak.legal) */
  baseUrl: string;
  /** Bot JWT token for authentication */
  botToken: string;
  /** Request timeout in ms (default: 30000) */
  timeoutMs?: number;
};

export type Case = {
  id: string;
  title: string;
  caseNumber: string;
  caseType: string;
  court: string;
  status: string;
  nextHearing: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CaseDetail = Case & {
  intelligence: Record<string, unknown> | null;
  documentCount: number;
  checklistCount: number;
};

export type CaseDocument = {
  id: string;
  title: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  parsedContent?: string;
};

export type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
  dueDate: string | null;
  priority: string;
};

export type ActionInput = {
  actionType: string;
  riskLevel: "low" | "medium" | "high";
  description: string;
  toolsUsed: string[];
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  status: "completed" | "pending_approval" | "failed";
  durationMs?: number;
  caseId?: string;
  result?: string;
  metadata?: Record<string, unknown>;
};

export type ApprovalRequest = {
  actionType: string;
  description: string;
  proposedAction: Record<string, unknown>;
  expiresInMs?: number;
};

export type ApprovalStatus = {
  id: string;
  status: "pending" | "approved" | "rejected" | "expired";
  reviewedAt: string | null;
};

export type TokenUsageReport = {
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  feature: string;
};

export type HeartbeatResponse = {
  ok: boolean;
  pendingApprovals: number;
  serverTime: string;
};

export class AnrakLegalClient {
  private baseUrl: string;
  private botToken: string;
  private timeoutMs: number;

  constructor(config: AnrakLegalClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.botToken = config.botToken;
    this.timeoutMs = config.timeoutMs ?? 30_000;
  }

  // --- Cases ---

  async listCases(): Promise<Case[]> {
    const res = await this.request<{ cases: Case[] }>("GET", "/api/bot/gateway/cases");
    return res.cases;
  }

  async getCase(caseId: string): Promise<CaseDetail> {
    const res = await this.request<{ case: CaseDetail }>("GET", `/api/bot/gateway/cases/${caseId}`);
    return res.case;
  }

  async getCaseDocuments(caseId: string): Promise<CaseDocument[]> {
    const res = await this.request<{ documents: CaseDocument[] }>(
      "GET",
      `/api/bot/gateway/cases/${caseId}/documents`,
    );
    return res.documents;
  }

  async searchCaseDocuments(
    caseId: string,
    query: string,
    limit = 10,
  ): Promise<{ chunks: Array<{ content: string; score: number; documentTitle: string }> }> {
    return this.request("POST", `/api/bot/gateway/cases/${caseId}/search`, {
      query,
      limit,
    });
  }

  async getChecklist(caseId: string): Promise<ChecklistItem[]> {
    const res = await this.request<{ items: ChecklistItem[] }>(
      "GET",
      `/api/bot/gateway/cases/${caseId}/checklist`,
    );
    return res.items;
  }

  async updateChecklistItem(
    caseId: string,
    itemId: string,
    updates: { completed?: boolean; text?: string },
  ): Promise<void> {
    await this.request("PUT", `/api/bot/gateway/cases/${caseId}/checklist`, {
      itemId,
      ...updates,
    });
  }

  // --- Cases - Write ---

  async saveDocument(
    caseId: string,
    title: string,
    content: string,
    fileType?: string,
  ): Promise<{ documentId: string; hash: string }> {
    return this.request("POST", `/api/bot/gateway/cases/${caseId}/documents`, {
      title,
      content,
      ...(fileType ? { fileType } : {}),
    });
  }

  async updateCase(
    caseId: string,
    updates: { description?: string; status?: string; notes?: string },
  ): Promise<void> {
    await this.request("PUT", `/api/bot/gateway/cases/${caseId}`, updates);
  }

  // --- Tasks - Self ---

  async createTask(
    description: string,
    priority?: "normal" | "high",
    caseId?: string,
  ): Promise<{ taskId: string }> {
    return this.request("POST", "/api/bot/gateway/tasks", {
      description,
      ...(priority ? { priority } : {}),
      ...(caseId ? { caseId } : {}),
    });
  }

  async listTasks(
    status?: string,
    limit?: number,
  ): Promise<{ tasks: Array<{ id: string; description: string; status: string }> }> {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (limit) params.set("limit", String(limit));
    const qs = params.toString();
    return this.request("GET", `/api/bot/gateway/tasks${qs ? `?${qs}` : ""}`);
  }

  // --- Schedules ---

  async createSchedule(schedule: {
    name: string;
    scheduleType: string;
    scheduleValue: string;
    taskType: string;
    description?: string;
    taskConfig?: Record<string, unknown>;
    enabled?: boolean;
  }): Promise<{ id: string }> {
    return this.request("POST", "/api/bot/gateway/schedules", schedule);
  }

  async updateSchedule(scheduleId: string, updates: Record<string, unknown>): Promise<void> {
    await this.request("PUT", `/api/bot/gateway/schedules/${scheduleId}`, updates);
  }

  async deleteSchedule(scheduleId: string): Promise<void> {
    await this.request("DELETE", `/api/bot/gateway/schedules/${scheduleId}`);
  }

  // --- Notify ---

  async notifyLawyer(
    subject: string,
    message: string,
    urgency?: "normal" | "urgent",
    caseId?: string,
  ): Promise<void> {
    await this.request("POST", "/api/bot/gateway/notify", {
      subject,
      message,
      ...(urgency ? { urgency } : {}),
      ...(caseId ? { caseId } : {}),
    });
  }

  // --- Actions & Audit ---

  async logAction(action: ActionInput): Promise<{ id: string }> {
    return this.request("POST", "/api/bot/gateway/actions", action);
  }

  // --- Approvals ---

  async requestApproval(approval: ApprovalRequest): Promise<{ id: string }> {
    return this.request("POST", "/api/bot/gateway/approvals", approval);
  }

  async checkApproval(approvalId: string): Promise<ApprovalStatus> {
    const res = await this.request<{ approval: ApprovalStatus }>(
      "GET",
      `/api/bot/gateway/approvals?id=${approvalId}`,
    );
    return res.approval;
  }

  // --- Token Usage ---

  async reportTokenUsage(usage: TokenUsageReport): Promise<void> {
    await this.request("POST", "/api/bot/gateway/tokens", usage);
  }

  // --- Heartbeat ---

  async heartbeat(): Promise<HeartbeatResponse> {
    return this.request("POST", "/api/bot/gateway/heartbeat", {});
  }

  // --- Internal ---

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const headers: Record<string, string> = {
        Authorization: `BotToken ${this.botToken}`,
        "Content-Type": "application/json",
        "User-Agent": "AnrakPilot/1.0",
      };

      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`AnrakLegal API error ${res.status}: ${text.slice(0, 200)}`);
      }

      return (await res.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * Create a client from environment variables.
 * Expects: BOT_API_URL, BOT_API_TOKEN
 */
export function createAnrakLegalClient(): AnrakLegalClient {
  const baseUrl = process.env.BOT_API_URL;
  const botToken = process.env.BOT_API_TOKEN;

  if (!baseUrl) {
    throw new Error("BOT_API_URL environment variable is required");
  }
  if (!botToken) {
    throw new Error("BOT_API_TOKEN environment variable is required");
  }

  return new AnrakLegalClient({ baseUrl, botToken });
}
