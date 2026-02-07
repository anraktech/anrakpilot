// Stub: WhatsApp removed from AnrakPilot fork.
export function normalizeWhatsAppTarget(target: string): string {
  return target;
}

export function isWhatsAppGroupJid(jid: string): boolean {
  return jid.endsWith("@g.us");
}
