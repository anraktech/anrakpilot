// AnrakPilot: Default model is Kimi K2.5 via Nvidia NIM (free credits).
// Falls back to OpenRouter Auto, then Claude for critical legal tasks.
export const DEFAULT_PROVIDER = "nvidia";
export const DEFAULT_MODEL = "moonshotai/kimi-k2.5";
// Kimi K2.5 supports 256K context window.
export const DEFAULT_CONTEXT_TOKENS = 256_000;
