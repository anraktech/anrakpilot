// Stub: wizard removed from AnrakPilot fork.
export type WizardStatus = "idle" | "running" | "done" | "error" | "cancelled";

export class WizardSession {
  private status: WizardStatus = "idle";
  private error: string | null = null;

  constructor(_runner: (prompter: unknown) => Promise<void>) {
    // no-op
  }

  getStatus(): WizardStatus {
    return this.status;
  }

  getError(): string | null {
    return this.error;
  }

  async next(): Promise<{ done: boolean }> {
    return { done: true };
  }

  async answer(_stepId: string, _value: unknown): Promise<void> {
    // no-op
  }

  cancel(): void {
    this.status = "cancelled";
  }
}
