/**
 * AnrakLegal Actions Tool
 *
 * Gives the agent the ability to log actions, request approvals,
 * report token usage, and send heartbeats to the AnrakLegal control plane.
 * Essential for audit compliance and the human-in-the-loop workflow.
 */

import { Type } from "@sinclair/typebox";
import { AnrakLegalClient } from "../../anraklegal/client.js";
import { stringEnum } from "../schema/typebox.js";
import { type AnyAgentTool, jsonResult, readStringParam, readNumberParam } from "./common.js";

const ACTIONS = [
  "log_action",
  "request_approval",
  "check_approval",
  "report_tokens",
  "heartbeat",
] as const;

const RISK_LEVELS = ["low", "medium", "high"] as const;
const ACTION_STATUSES = ["completed", "pending_approval", "failed"] as const;

const AnrakActionsSchema = Type.Object({
  action: stringEnum(ACTIONS, {
    description:
      "Action: log_action (audit log), request_approval (human-in-the-loop), " +
      "check_approval (poll status), report_tokens (usage tracking), heartbeat (health check)",
  }),

  // log_action fields
  action_type: Type.Optional(
    Type.String({
      description: "Type of action performed: research, draft, analyze, browse, schedule, notify",
    }),
  ),
  risk_level: Type.Optional(
    stringEnum(RISK_LEVELS, { description: "Risk classification: low, medium, high" }),
  ),
  description: Type.Optional(
    Type.String({ description: "Human-readable description of what was done" }),
  ),
  tools_used: Type.Optional(
    Type.Array(Type.String(), { description: "List of tools/skills used" }),
  ),
  model_used: Type.Optional(Type.String({ description: "LLM model ID used" })),
  input_tokens: Type.Optional(Type.Number({ description: "Input tokens consumed" })),
  output_tokens: Type.Optional(Type.Number({ description: "Output tokens consumed" })),
  cost_usd: Type.Optional(Type.Number({ description: "Estimated cost in USD" })),
  status: Type.Optional(stringEnum(ACTION_STATUSES, { description: "Action status" })),
  duration_ms: Type.Optional(Type.Number({ description: "Action duration in milliseconds" })),
  case_id: Type.Optional(Type.String({ description: "Associated case ID" })),
  metadata: Type.Optional(
    Type.Record(Type.String(), Type.Unknown(), { description: "Additional structured data" }),
  ),

  // request_approval fields
  proposed_action: Type.Optional(
    Type.Record(Type.String(), Type.Unknown(), {
      description: "Structured data describing the proposed action for lawyer review",
    }),
  ),
  expires_in_ms: Type.Optional(
    Type.Number({ description: "Approval expiry in ms (default: 24 hours)" }),
  ),

  // check_approval fields
  approval_id: Type.Optional(
    Type.String({ description: "Approval ID to check (from request_approval)" }),
  ),

  // report_tokens fields
  feature: Type.Optional(
    Type.String({ description: "Feature name for token reporting (e.g., case-research)" }),
  ),
});

let _client: AnrakLegalClient | null = null;

function getClient(): AnrakLegalClient {
  if (!_client) {
    const baseUrl = process.env.BOT_API_URL;
    const botToken = process.env.BOT_API_TOKEN;
    if (!baseUrl || !botToken) {
      throw new Error(
        "AnrakLegal API not configured. Set BOT_API_URL and BOT_API_TOKEN environment variables.",
      );
    }
    _client = new AnrakLegalClient({ baseUrl, botToken });
  }
  return _client;
}

export function createAnrakActionsTool(): AnyAgentTool | null {
  if (!process.env.BOT_API_URL || !process.env.BOT_API_TOKEN) {
    return null;
  }

  return {
    label: "AnrakLegal Actions",
    name: "anrak_actions",
    description:
      "Log actions for audit compliance, request lawyer approval for high-risk actions, " +
      "check approval status, report token usage for billing, and send heartbeats. " +
      "IMPORTANT: Always log_action after completing any skill. " +
      "Use request_approval for HIGH risk actions (document drafting, filing prep). " +
      "Use report_tokens after every LLM call for accurate billing.",
    parameters: AnrakActionsSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const action = readStringParam(params, "action", { required: true });
      const client = getClient();

      switch (action) {
        case "log_action": {
          const actionType = readStringParam(params, "action_type", { required: true });
          const riskLevel = readStringParam(params, "risk_level", { required: true }) as
            | "low"
            | "medium"
            | "high";
          const description = readStringParam(params, "description", { required: true });
          const toolsUsed = (params.tools_used as string[]) ?? [];
          const modelUsed = readStringParam(params, "model_used") ?? "unknown";
          const inputTokens = readNumberParam(params, "input_tokens") ?? 0;
          const outputTokens = readNumberParam(params, "output_tokens") ?? 0;
          const costUsd = readNumberParam(params, "cost_usd") ?? 0;
          const status = (readStringParam(params, "status") ?? "completed") as
            | "completed"
            | "pending_approval"
            | "failed";
          const durationMs = readNumberParam(params, "duration_ms");
          const caseId = readStringParam(params, "case_id");
          const metadata = params.metadata as Record<string, unknown> | undefined;

          const result = await client.logAction({
            actionType,
            riskLevel,
            description,
            toolsUsed,
            modelUsed,
            inputTokens,
            outputTokens,
            costUsd,
            status,
            ...(durationMs !== undefined ? { durationMs } : {}),
            ...(caseId ? { caseId } : {}),
            ...(metadata ? { metadata } : {}),
          });

          return jsonResult({ ok: true, actionId: result.id });
        }

        case "request_approval": {
          const actionType = readStringParam(params, "action_type", { required: true });
          const description = readStringParam(params, "description", { required: true });
          const proposedAction = (params.proposed_action as Record<string, unknown>) ?? {};
          const expiresInMs = readNumberParam(params, "expires_in_ms");

          const result = await client.requestApproval({
            actionType,
            description,
            proposedAction,
            ...(expiresInMs !== undefined ? { expiresInMs } : {}),
          });

          return jsonResult({ ok: true, approvalId: result.id });
        }

        case "check_approval": {
          const approvalId = readStringParam(params, "approval_id", { required: true });
          const approval = await client.checkApproval(approvalId);
          return jsonResult({ approval });
        }

        case "report_tokens": {
          const modelUsed = readStringParam(params, "model_used", { required: true });
          const inputTokens = readNumberParam(params, "input_tokens", { required: true }) ?? 0;
          const outputTokens = readNumberParam(params, "output_tokens", { required: true }) ?? 0;
          const costUsd = readNumberParam(params, "cost_usd", { required: true }) ?? 0;
          const feature = readStringParam(params, "feature", { required: true });

          await client.reportTokenUsage({
            modelUsed,
            inputTokens,
            outputTokens,
            costUsd,
            feature,
          });

          return jsonResult({ ok: true });
        }

        case "heartbeat": {
          const result = await client.heartbeat();
          return jsonResult(result);
        }

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    },
  };
}
