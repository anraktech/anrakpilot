// Stub: canvas-host removed from AnrakPilot fork.
import type { IncomingMessage, ServerResponse } from "node:http";

export const A2UI_PATH = "/_a2ui";
export const CANVAS_HOST_PATH = "/_canvas";
export const CANVAS_WS_PATH = "/_canvas/ws";

export function handleA2uiHttpRequest(
  _req: IncomingMessage,
  _res: ServerResponse,
  _opts?: unknown,
): boolean {
  return false;
}
