// Stub: terminal removed from AnrakPilot fork (headless server).
// All theme functions return the input string unchanged (no styling in headless mode).
const identity = (text: string) => text;

export const theme = {
  muted: identity,
  success: identity,
  warn: identity,
  info: identity,
  error: identity,
  bold: identity,
  dim: identity,
  underline: identity,
  italic: identity,
  strikethrough: identity,
  cyan: identity,
  green: identity,
  yellow: identity,
  red: identity,
  blue: identity,
  magenta: identity,
  white: identity,
  gray: identity,
};
