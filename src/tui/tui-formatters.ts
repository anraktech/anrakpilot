// Stub: TUI removed from AnrakPilot fork (headless server).
export function formatTuiMessage(text: string): string {
  return text;
}

/**
 * Extract text content from a message object.
 * Used by images.ts for detecting image references in conversation history.
 */
export function extractTextFromMessage(message: unknown): string {
  if (!message || typeof message !== "object") {
    return "";
  }
  const record = message as Record<string, unknown>;
  const content = record.content;

  if (typeof content === "string") {
    return content.trim();
  }
  if (!Array.isArray(content)) {
    return "";
  }

  const textParts: string[] = [];
  for (const block of content) {
    if (!block || typeof block !== "object") {
      continue;
    }
    const b = block as Record<string, unknown>;
    if (b.type === "text" && typeof b.text === "string") {
      textParts.push(b.text);
    }
  }
  return textParts.join("\n").trim();
}
