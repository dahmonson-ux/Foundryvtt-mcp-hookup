import type {
  ActionResult,
  ActionSelection,
  AgentId,
  CommandId,
  IdempotencyKey
} from "@foundry-ai-gateway/contracts";

export interface IdempotencyEntry {
  agentId: AgentId;
  commandId: CommandId;
  key: IdempotencyKey;
  fingerprint: string;
  selection: ActionSelection;
  result: ActionResult;
}

export interface IdempotencyStore {
  get(key: IdempotencyKey): Promise<IdempotencyEntry | undefined>;
  set(entry: IdempotencyEntry): Promise<void>;
}

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly entries = new Map<IdempotencyKey, IdempotencyEntry>();

  async get(key: IdempotencyKey): Promise<IdempotencyEntry | undefined> {
    const entry = this.entries.get(key);
    return entry ? structuredClone(entry) : undefined;
  }

  async set(entry: IdempotencyEntry): Promise<void> {
    this.entries.set(entry.key, structuredClone(entry));
  }
}

export function selectionFingerprint(selection: ActionSelection): string {
  return JSON.stringify({
    agentId: selection.agentId,
    actionId: selection.actionId,
    stateVersion: selection.stateVersion
  });
}
