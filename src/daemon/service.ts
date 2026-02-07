// Stub: daemon removed from AnrakPilot fork.
export type GatewayService = {
  installed: boolean;
  running: boolean;
  enabled: boolean;
  label?: string;
};

export function resolveGatewayService(..._args: unknown[]): GatewayService {
  return { installed: false, running: false, enabled: false };
}
