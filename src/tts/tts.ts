// Stub: TTS removed from AnrakPilot fork.
export const OPENAI_TTS_MODELS = ["tts-1", "tts-1-hd"] as const;
export const OPENAI_TTS_VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] as const;

type TtsConfig = Record<string, unknown>;
type TtsProvider = "openai" | "elevenlabs" | "edge";

export function resolveTtsConfig(_cfg: unknown): TtsConfig {
  return {};
}

export function resolveTtsPrefsPath(_config: TtsConfig): string {
  return "";
}

export function getTtsProvider(_config: TtsConfig, _prefsPath: string): TtsProvider {
  return "openai";
}

export function resolveTtsAutoMode(_opts: { config: TtsConfig; prefsPath: string }): boolean {
  return false;
}

export function resolveTtsProviderOrder(_provider: TtsProvider): TtsProvider[] {
  return [];
}

export function isTtsProviderConfigured(_config: TtsConfig, _provider: TtsProvider): boolean {
  return false;
}

export function isTtsEnabled(_config: TtsConfig, _prefsPath: string): boolean {
  return false;
}

export function resolveTtsApiKey(_config: TtsConfig, _provider: TtsProvider): string | undefined {
  return undefined;
}

export function setTtsEnabled(_prefsPath: string, _enabled: boolean): void {
  // no-op
}

export function setTtsProvider(_prefsPath: string, _provider: TtsProvider): void {
  // no-op
}

export function buildTtsSystemPromptHint(_config: unknown): string | undefined {
  return undefined;
}

export async function textToSpeech(_opts: {
  text: string;
  cfg: unknown;
  channel?: string;
}): Promise<{
  success: boolean;
  audioPath?: string;
  provider?: string;
  outputFormat?: string;
  voiceCompatible?: boolean;
  error?: string;
}> {
  return { success: false, error: "TTS is not available in AnrakPilot" };
}
