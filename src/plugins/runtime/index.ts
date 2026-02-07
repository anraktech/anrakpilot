/**
 * AnrakPilot: Plugin runtime with messaging channels removed.
 * All channel-specific functions are stubbed as no-ops.
 */
import { createRequire } from "node:module";
import type { PluginRuntime } from "./types.js";
import { resolveEffectiveMessagesConfig, resolveHumanDelayConfig } from "../../agents/identity.js";
import { createMemoryGetTool, createMemorySearchTool } from "../../agents/tools/memory-tool.js";
import {
  chunkByNewline,
  chunkMarkdownText,
  chunkMarkdownTextWithMode,
  chunkText,
  chunkTextWithMode,
  resolveChunkMode,
  resolveTextChunkLimit,
} from "../../auto-reply/chunk.js";
import {
  hasControlCommand,
  isControlCommandMessage,
  shouldComputeCommandAuthorized,
} from "../../auto-reply/command-detection.js";
import { shouldHandleTextCommands } from "../../auto-reply/commands-registry.js";
import {
  formatAgentEnvelope,
  formatInboundEnvelope,
  resolveEnvelopeFormatOptions,
} from "../../auto-reply/envelope.js";
import {
  createInboundDebouncer,
  resolveInboundDebounceMs,
} from "../../auto-reply/inbound-debounce.js";
import { dispatchReplyFromConfig } from "../../auto-reply/reply/dispatch-from-config.js";
import { finalizeInboundContext } from "../../auto-reply/reply/inbound-context.js";
import {
  buildMentionRegexes,
  matchesMentionPatterns,
  matchesMentionWithExplicit,
} from "../../auto-reply/reply/mentions.js";
import { dispatchReplyWithBufferedBlockDispatcher } from "../../auto-reply/reply/provider-dispatcher.js";
import { createReplyDispatcherWithTyping } from "../../auto-reply/reply/reply-dispatcher.js";
import { removeAckReactionAfterReply, shouldAckReaction } from "../../channels/ack-reactions.js";
import { resolveCommandAuthorizedFromAuthorizers } from "../../channels/command-gating.js";
import { recordInboundSession } from "../../channels/session.js";
import { registerMemoryCli } from "../../cli/memory-cli.js";
import { loadConfig, writeConfigFile } from "../../config/config.js";
import {
  resolveChannelGroupPolicy,
  resolveChannelGroupRequireMention,
} from "../../config/group-policy.js";
import { resolveMarkdownTableMode } from "../../config/markdown-tables.js";
import { resolveStateDir } from "../../config/paths.js";
import {
  readSessionUpdatedAt,
  recordSessionMetaFromInbound,
  resolveStorePath,
  updateLastRoute,
} from "../../config/sessions.js";
import { shouldLogVerbose } from "../../globals.js";
import { getChannelActivity, recordChannelActivity } from "../../infra/channel-activity.js";
import { enqueueSystemEvent } from "../../infra/system-events.js";
import { getChildLogger } from "../../logging.js";
import { normalizeLogLevel } from "../../logging/levels.js";
import { convertMarkdownTables } from "../../markdown/tables.js";
import { isVoiceCompatibleAudio } from "../../media/audio.js";
import { mediaKindFromMime } from "../../media/constants.js";
import { fetchRemoteMedia } from "../../media/fetch.js";
import { getImageMetadata, resizeToJpeg } from "../../media/image-ops.js";
import { detectMime } from "../../media/mime.js";
import { saveMediaBuffer } from "../../media/store.js";
import { buildPairingReply } from "../../pairing/pairing-messages.js";
import {
  readChannelAllowFromStore,
  upsertChannelPairingRequest,
} from "../../pairing/pairing-store.js";
import { runCommandWithTimeout } from "../../process/exec.js";
import { resolveAgentRoute } from "../../routing/resolve-route.js";
import { formatNativeDependencyHint } from "./native-deps.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const noopAsync = async (..._args: any[]) => {};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const noopSync = (..._args: any[]) => null as any;
const noopFalse = () => false;
const noopEmptyArray = () => [] as never[];

let cachedVersion: string | null = null;

function resolveVersion(): string {
  if (cachedVersion) {
    return cachedVersion;
  }
  try {
    const require = createRequire(import.meta.url);
    const pkg = require("../../../package.json") as { version?: string };
    cachedVersion = pkg.version ?? "unknown";
    return cachedVersion;
  } catch {
    cachedVersion = "unknown";
    return cachedVersion;
  }
}

export function createPluginRuntime(): PluginRuntime {
  return {
    version: resolveVersion(),
    config: {
      loadConfig,
      writeConfigFile,
    },
    system: {
      enqueueSystemEvent,
      runCommandWithTimeout,
      formatNativeDependencyHint,
    },
    media: {
      loadWebMedia: noopAsync,
      detectMime,
      mediaKindFromMime,
      isVoiceCompatibleAudio,
      getImageMetadata,
      resizeToJpeg,
    },
    tts: {
      textToSpeechTelephony: noopAsync,
    },
    tools: {
      createMemoryGetTool,
      createMemorySearchTool,
      registerMemoryCli,
    },
    channel: {
      text: {
        chunkByNewline,
        chunkMarkdownText,
        chunkMarkdownTextWithMode,
        chunkText,
        chunkTextWithMode,
        resolveChunkMode,
        resolveTextChunkLimit,
        hasControlCommand,
        resolveMarkdownTableMode,
        convertMarkdownTables,
      },
      reply: {
        dispatchReplyWithBufferedBlockDispatcher,
        createReplyDispatcherWithTyping,
        resolveEffectiveMessagesConfig,
        resolveHumanDelayConfig,
        dispatchReplyFromConfig,
        finalizeInboundContext,
        formatAgentEnvelope,
        formatInboundEnvelope,
        resolveEnvelopeFormatOptions,
      },
      routing: {
        resolveAgentRoute,
      },
      pairing: {
        buildPairingReply,
        readAllowFromStore: readChannelAllowFromStore,
        upsertPairingRequest: upsertChannelPairingRequest,
      },
      media: {
        fetchRemoteMedia,
        saveMediaBuffer,
      },
      activity: {
        record: recordChannelActivity,
        get: getChannelActivity,
      },
      session: {
        resolveStorePath,
        readSessionUpdatedAt,
        recordSessionMetaFromInbound,
        recordInboundSession,
        updateLastRoute,
      },
      mentions: {
        buildMentionRegexes,
        matchesMentionPatterns,
        matchesMentionWithExplicit,
      },
      reactions: {
        shouldAckReaction,
        removeAckReactionAfterReply,
      },
      groups: {
        resolveGroupPolicy: resolveChannelGroupPolicy,
        resolveRequireMention: resolveChannelGroupRequireMention,
      },
      debounce: {
        createInboundDebouncer,
        resolveInboundDebounceMs,
      },
      commands: {
        resolveCommandAuthorizedFromAuthorizers,
        isControlCommandMessage,
        shouldComputeCommandAuthorized,
        shouldHandleTextCommands,
      },
      // All channel-specific sections stubbed out for AnrakPilot
      discord: {
        messageActions: noopEmptyArray,
        auditChannelPermissions: noopAsync,
        listDirectoryGroupsLive: noopAsync,
        listDirectoryPeersLive: noopAsync,
        probeDiscord: noopAsync,
        resolveChannelAllowlist: noopSync,
        resolveUserAllowlist: noopSync,
        sendMessageDiscord: noopAsync,
        sendPollDiscord: noopAsync,
        monitorDiscordProvider: noopAsync,
      },
      slack: {
        listDirectoryGroupsLive: noopAsync,
        listDirectoryPeersLive: noopAsync,
        probeSlack: noopAsync,
        resolveChannelAllowlist: noopSync,
        resolveUserAllowlist: noopSync,
        sendMessageSlack: noopAsync,
        monitorSlackProvider: noopAsync,
        handleSlackAction: noopAsync,
      },
      telegram: {
        auditGroupMembership: noopAsync,
        collectUnmentionedGroupIds: noopSync,
        probeTelegram: noopAsync,
        resolveTelegramToken: noopSync,
        sendMessageTelegram: noopAsync,
        monitorTelegramProvider: noopAsync,
        messageActions: noopEmptyArray,
      },
      signal: {
        probeSignal: noopAsync,
        sendMessageSignal: noopAsync,
        monitorSignalProvider: noopAsync,
        messageActions: noopEmptyArray,
      },
      imessage: {
        monitorIMessageProvider: noopAsync,
        probeIMessage: noopAsync,
        sendMessageIMessage: noopAsync,
      },
      whatsapp: {
        getActiveWebListener: noopSync,
        getWebAuthAgeMs: noopSync,
        logoutWeb: noopAsync,
        logWebSelfId: noopSync,
        readWebSelfId: noopSync,
        webAuthExists: noopFalse,
        sendMessageWhatsApp: noopAsync,
        sendPollWhatsApp: noopAsync,
        loginWeb: noopAsync,
        startWebLoginWithQr: noopAsync,
        waitForWebLogin: noopAsync,
        monitorWebChannel: noopAsync,
        handleWhatsAppAction: noopAsync,
        createLoginTool: noopSync,
      },
      line: {
        listLineAccountIds: noopEmptyArray,
        resolveDefaultLineAccountId: noopSync,
        resolveLineAccount: noopSync,
        normalizeAccountId: noopSync,
        probeLineBot: noopAsync,
        sendMessageLine: noopAsync,
        pushMessageLine: noopAsync,
        pushMessagesLine: noopAsync,
        pushFlexMessage: noopAsync,
        pushTemplateMessage: noopAsync,
        pushLocationMessage: noopAsync,
        pushTextMessageWithQuickReplies: noopAsync,
        createQuickReplyItems: noopEmptyArray,
        buildTemplateMessageFromPayload: noopSync,
        monitorLineProvider: noopAsync,
      },
    },
    logging: {
      shouldLogVerbose,
      getChildLogger: (bindings, opts) => {
        const logger = getChildLogger(bindings, {
          level: opts?.level ? normalizeLogLevel(opts.level) : undefined,
        });
        return {
          debug: (message) => logger.debug?.(message),
          info: (message) => logger.info(message),
          warn: (message) => logger.warn(message),
          error: (message) => logger.error(message),
        };
      },
    },
    state: {
      resolveStateDir,
    },
  };
}

export type { PluginRuntime } from "./types.js";
