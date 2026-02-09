/**
 * AnrakLegal Cases Tool
 *
 * Gives the agent structured access to the lawyer's cases, documents,
 * checklists, and semantic search via the AnrakLegal control plane API.
 */

import { Type } from "@sinclair/typebox";
import { AnrakLegalClient } from "../../anraklegal/client.js";
import { stringEnum } from "../schema/typebox.js";
import { type AnyAgentTool, jsonResult, readStringParam, readNumberParam } from "./common.js";

const ACTIONS = [
  "list_cases",
  "get_case",
  "get_documents",
  "search_documents",
  "get_checklist",
  "update_checklist_item",
  "save_document",
  "update_case",
] as const;

const AnrakCasesSchema = Type.Object({
  action: stringEnum(ACTIONS, {
    description:
      "Action to perform: list_cases (all cases), get_case (case details), get_documents (case docs), " +
      "search_documents (semantic search), get_checklist (checklist items), update_checklist_item (mark item done), " +
      "save_document (save content as case document), update_case (update case description/status/notes)",
  }),
  case_id: Type.Optional(
    Type.String({ description: "Case ID (required for all actions except list_cases)" }),
  ),
  query: Type.Optional(
    Type.String({ description: "Search query (required for search_documents)" }),
  ),
  limit: Type.Optional(
    Type.Number({ description: "Max results for search (default: 10)", minimum: 1, maximum: 50 }),
  ),
  item_id: Type.Optional(
    Type.String({ description: "Checklist item ID (required for update_checklist_item)" }),
  ),
  completed: Type.Optional(
    Type.Boolean({ description: "Mark checklist item as completed/incomplete" }),
  ),
  text: Type.Optional(Type.String({ description: "Updated text for checklist item" })),
  title: Type.Optional(Type.String({ description: "Document title (for save_document)" })),
  content: Type.Optional(Type.String({ description: "Document content (for save_document)" })),
  file_type: Type.Optional(
    Type.String({ description: "File type, e.g. 'md', 'txt' (default: md)" }),
  ),
  notes: Type.Optional(Type.String({ description: "Case notes to update (for update_case)" })),
  status: Type.Optional(
    Type.String({ description: "Case status: ACTIVE, ON_HOLD, CLOSED (for update_case)" }),
  ),
  description: Type.Optional(Type.String({ description: "Case description (for update_case)" })),
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

export function createAnrakCasesTool(): AnyAgentTool | null {
  // Only available when AnrakLegal API is configured
  if (!process.env.BOT_API_URL || !process.env.BOT_API_TOKEN) {
    return null;
  }

  return {
    label: "AnrakLegal Cases",
    name: "anrak_cases",
    description:
      "Access and manage the lawyer's cases, documents, and checklists from the AnrakLegal platform. " +
      "Use list_cases to see all cases, get_case for details, get_documents for case files, " +
      "search_documents for semantic search across case content, get_checklist for task items, " +
      "update_checklist_item to mark items complete, save_document to save research/drafts as case docs, " +
      "and update_case to update case metadata (description, status, notes).",
    parameters: AnrakCasesSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const action = readStringParam(params, "action", { required: true });
      const client = getClient();

      switch (action) {
        case "list_cases": {
          const cases = await client.listCases();
          return jsonResult({ cases, count: cases.length });
        }

        case "get_case": {
          const caseId = readStringParam(params, "case_id", { required: true });
          const caseDetail = await client.getCase(caseId);
          return jsonResult({ case: caseDetail });
        }

        case "get_documents": {
          const caseId = readStringParam(params, "case_id", { required: true });
          const documents = await client.getCaseDocuments(caseId);
          return jsonResult({ documents, count: documents.length });
        }

        case "search_documents": {
          const caseId = readStringParam(params, "case_id", { required: true });
          const query = readStringParam(params, "query", { required: true });
          const limit = readNumberParam(params, "limit") ?? 10;
          const results = await client.searchCaseDocuments(caseId, query, limit);
          return jsonResult(results);
        }

        case "get_checklist": {
          const caseId = readStringParam(params, "case_id", { required: true });
          const items = await client.getChecklist(caseId);
          return jsonResult({
            items,
            total: items.length,
            completed: items.filter((i) => i.completed).length,
          });
        }

        case "update_checklist_item": {
          const caseId = readStringParam(params, "case_id", { required: true });
          const itemId = readStringParam(params, "item_id", { required: true });
          const completed = params.completed as boolean | undefined;
          const text = readStringParam(params, "text");
          const updates: { completed?: boolean; text?: string } = {};
          if (completed !== undefined) updates.completed = completed;
          if (text !== undefined) updates.text = text;
          await client.updateChecklistItem(caseId, itemId, updates);
          return jsonResult({ ok: true, itemId, updates });
        }

        case "save_document": {
          const caseId = readStringParam(params, "case_id", { required: true });
          const title = readStringParam(params, "title", { required: true });
          const content = readStringParam(params, "content", { required: true });
          const fileType = readStringParam(params, "file_type");
          const result = await client.saveDocument(caseId, title, content, fileType ?? undefined);
          return jsonResult({ ok: true, documentId: result.documentId });
        }

        case "update_case": {
          const caseId = readStringParam(params, "case_id", { required: true });
          const description = readStringParam(params, "description");
          const status = readStringParam(params, "status");
          const notes = readStringParam(params, "notes");
          const updates: { description?: string; status?: string; notes?: string } = {};
          if (description) updates.description = description;
          if (status) updates.status = status;
          if (notes) updates.notes = notes;
          await client.updateCase(caseId, updates);
          return jsonResult({ ok: true, caseId, updates });
        }

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    },
  };
}
