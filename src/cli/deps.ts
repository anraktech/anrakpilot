// AnrakPilot: Messaging channels removed. All send functions are no-ops.
import type { OutboundSendDeps } from "../infra/outbound/deliver.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SendFn = (...args: any[]) => Promise<void>;

const noopSend: SendFn = async () => {
  // AnrakPilot does not send messages via channels.
};

export type CliDeps = {
  sendMessageWhatsApp: SendFn;
  sendMessageTelegram: SendFn;
  sendMessageDiscord: SendFn;
  sendMessageSlack: SendFn;
  sendMessageSignal: SendFn;
  sendMessageIMessage: SendFn;
};

export function createDefaultDeps(): CliDeps {
  return {
    sendMessageWhatsApp: noopSend,
    sendMessageTelegram: noopSend,
    sendMessageDiscord: noopSend,
    sendMessageSlack: noopSend,
    sendMessageSignal: noopSend,
    sendMessageIMessage: noopSend,
  };
}

export function createOutboundSendDeps(deps: CliDeps): OutboundSendDeps {
  return {
    sendWhatsApp: deps.sendMessageWhatsApp,
    sendTelegram: deps.sendMessageTelegram,
    sendDiscord: deps.sendMessageDiscord,
    sendSlack: deps.sendMessageSlack,
    sendSignal: deps.sendMessageSignal,
    sendIMessage: deps.sendMessageIMessage,
  };
}

export function logWebSelfId(_selfId: string): void {
  // no-op
}
