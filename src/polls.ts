// Stub: polls removed from AnrakPilot fork.
export type PollOption = { text: string; votes?: number };
export type Poll = { question: string; options: PollOption[] };

export function parsePollFromText(_text: string): Poll | null {
  return null;
}

export function formatPollResult(_poll: Poll): string {
  return "";
}

export function normalizePollInput(_input: unknown): Poll | null {
  return null;
}
