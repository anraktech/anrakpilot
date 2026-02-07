// Stub: Signal removed from AnrakPilot fork.
export type SignalTextStyleRange = {
  start: number;
  length: number;
  style: string;
};

export function markdownToSignalTextChunks(
  _text: string,
): { text: string; textStyles?: SignalTextStyleRange[] }[] {
  return [{ text: _text }];
}
