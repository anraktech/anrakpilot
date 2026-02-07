// Stub: terminal removed from AnrakPilot fork (headless server).
export function renderTable(headers: string[], rows: string[][], _opts?: unknown): string {
  const lines: string[] = [];
  lines.push(headers.join("\t"));
  for (const row of rows) {
    lines.push(row.join("\t"));
  }
  return lines.join("\n");
}
