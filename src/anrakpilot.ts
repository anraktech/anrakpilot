#!/usr/bin/env node
/**
 * AnrakPilot - Autonomous AI Bot for Lawyers
 *
 * Stripped-down OpenClaw fork that runs as a gateway server with:
 * - Agent runtime (LLM loop, skills, memory)
 * - Cron scheduler (scheduled tasks)
 * - Browser automation (Playwright/CDP)
 * - Legal skills (case research, document analysis, etc.)
 *
 * No messaging channels, no TUI, no native apps.
 * Communicates with AnrakLegal control plane via REST API.
 */
import process from "node:process";
import { loadDotEnv } from "./infra/dotenv.js";
import { normalizeEnv } from "./infra/env.js";
import { formatUncaughtError } from "./infra/errors.js";
import { ensureOpenClawCliOnPath } from "./infra/path-env.js";
import { assertSupportedRuntime } from "./infra/runtime-guard.js";
import { installUnhandledRejectionHandler } from "./infra/unhandled-rejections.js";
import { enableConsoleCapture } from "./logging.js";

// Initialize environment
loadDotEnv({ quiet: true });
normalizeEnv();
ensureOpenClawCliOnPath();
enableConsoleCapture();
assertSupportedRuntime();

// Skip channels - AnrakPilot communicates via REST API only
process.env.OPENCLAW_SKIP_CHANNELS = "1";
// Skip canvas host - not needed
process.env.OPENCLAW_SKIP_CANVAS_HOST = "1";

installUnhandledRejectionHandler();

process.on("uncaughtException", (error) => {
  console.error("[anrakpilot] Uncaught exception:", formatUncaughtError(error));
  process.exit(1);
});

async function main() {
  const port = parseInt(process.env.OPENCLAW_GATEWAY_PORT ?? "18789", 10);

  const { startGatewayServer } = await import("./gateway/server.impl.js");

  const server = await startGatewayServer(port, {
    bind: "lan", // Listen on 0.0.0.0 for container access
    controlUiEnabled: false,
  });

  console.log(`[anrakpilot] Gateway server started on port ${port}`);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`[anrakpilot] Received ${signal}, shutting down...`);
    await server.close({ reason: `${signal} received` });
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("[anrakpilot] Failed to start:", formatUncaughtError(err));
  process.exit(1);
});
