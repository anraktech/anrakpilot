/**
 * AnrakLegal Composio Tool
 *
 * Gives the agent access to the lawyer's connected apps (Gmail, Google Calendar,
 * Drive, Outlook, Slack, etc.) via the Composio gateway on the control plane.
 *
 * The bot never talks to Composio directly — all calls proxy through:
 *   POST /api/bot/gateway/composio
 *
 * Two actions:
 *   - discover_tools: List available tools for connected apps
 *   - execute_tool: Execute a specific Composio tool by name
 */

import { Type } from "@sinclair/typebox";
import { AnrakLegalClient } from "../../anraklegal/client.js";
import { stringEnum } from "../schema/typebox.js";
import { type AnyAgentTool, jsonResult, readStringParam } from "./common.js";

const ACTIONS = ["discover_tools", "execute_tool"] as const;

const AnrakComposioSchema = Type.Object({
  action: stringEnum(ACTIONS, {
    description:
      "Action: discover_tools (list available tools for connected apps), " +
      "execute_tool (run a specific Composio tool by name with arguments)",
  }),
  toolkits: Type.Optional(
    Type.Array(Type.String(), {
      description:
        'Toolkit slugs to discover tools for (e.g., ["GMAIL", "GOOGLECALENDAR"]). ' +
        "Required for discover_tools. Get available toolkits from heartbeat connectedToolkits.",
    }),
  ),
  tool_name: Type.Optional(
    Type.String({
      description:
        'Full Composio tool name to execute (e.g., "GMAIL_LIST_EMAILS", "GOOGLECALENDAR_LIST_EVENTS"). ' +
        "Required for execute_tool. Get names from discover_tools first.",
    }),
  ),
  tool_arguments: Type.Optional(
    Type.Record(Type.String(), Type.Unknown(), {
      description: "Arguments to pass to the Composio tool. Schema available from discover_tools.",
    }),
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

export function createAnrakComposioTool(): AnyAgentTool | null {
  // Only available when AnrakLegal API is configured
  if (!process.env.BOT_API_URL || !process.env.BOT_API_TOKEN) {
    return null;
  }

  return {
    label: "AnrakLegal Connected Apps",
    name: "anrak_composio",
    description:
      "Access the lawyer's connected apps (Gmail, Google Calendar, Drive, Outlook, Slack, Notion, etc.) " +
      "via Composio. Use discover_tools to see what tools are available for the connected apps, then " +
      "execute_tool to run a specific tool. Read operations (list emails, get events, search files) " +
      "execute immediately. Write operations (send email, create event, delete file) require lawyer approval. " +
      "IMPORTANT: Only use this for apps the lawyer has connected — check heartbeat connectedToolkits first.",
    parameters: AnrakComposioSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const action = readStringParam(params, "action", { required: true });
      const client = getClient();

      switch (action) {
        case "discover_tools": {
          const toolkits = params.toolkits as string[] | undefined;
          if (!toolkits || !Array.isArray(toolkits) || toolkits.length === 0) {
            return jsonResult({
              error:
                "toolkits array is required for discover_tools. " +
                'Use the toolkit slugs from heartbeat connectedToolkits (e.g., ["GMAIL", "GOOGLEDRIVE"]).',
            });
          }

          const response = await client.listComposioTools(toolkits);
          return jsonResult({
            tools: response.tools.map((t) => ({
              name: t.name,
              description: t.description,
              toolkit: t.toolkit,
            })),
            count: response.tools.length,
            ...(response.message ? { message: response.message } : {}),
          });
        }

        case "execute_tool": {
          const toolName = readStringParam(params, "tool_name", { required: true });
          const toolArgs = (params.tool_arguments as Record<string, unknown>) ?? {};

          const response = await client.executeComposioTool(toolName, toolArgs);

          if ("approvalRequired" in response) {
            return jsonResult({
              approvalRequired: true,
              approvalId: response.approvalId,
              reason: response.reason,
              message:
                "This is a write operation that requires lawyer approval. " +
                "The approval request has been created. Wait for the lawyer to approve " +
                "before retrying, or notify them via anrak_actions → notify_lawyer.",
            });
          }

          return jsonResult({ result: response.result });
        }

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    },
  };
}
