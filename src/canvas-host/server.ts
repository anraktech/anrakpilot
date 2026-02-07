// Stub: canvas-host removed from AnrakPilot fork.
export type CanvasHostHandler = {
  rootDir?: string;
  port?: number;
  close: () => Promise<void>;
};

export type CanvasHostServer = {
  port?: number;
  close: () => Promise<void>;
};

export async function createCanvasHostHandler(_opts: {
  runtime: unknown;
  rootDir?: string;
  basePath?: string;
  allowInTests?: boolean;
  liveReload?: unknown;
}): Promise<CanvasHostHandler> {
  return { close: async () => {} };
}
