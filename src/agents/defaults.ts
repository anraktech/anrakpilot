// AnrakPilot: Default model is KIMI K2 via OpenRouter for cost efficiency.
// Claude Sonnet/Opus used for critical legal tasks (drafting, court prep).
export const DEFAULT_PROVIDER = "openrouter";
export const DEFAULT_MODEL = "moonshotai/kimi-k2-0905";
// KIMI K2 supports 256K context window.
export const DEFAULT_CONTEXT_TOKENS = 256_000;
