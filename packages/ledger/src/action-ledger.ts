import type {
  LedgerRecord,
  CommandId,
  IdempotencyKey
} from "@foundry-ai-gateway/contracts";

export interface ActionLedger {
  append(record: LedgerRecord): Promise<void>;
  findByCommandId(commandId: CommandId): Promise<LedgerRecord[]>;
  findByIdempotencyKey(idempotencyKey: IdempotencyKey): Promise<LedgerRecord[]>;
  all(): Promise<LedgerRecord[]>;
}

export class InMemoryActionLedger implements ActionLedger {
  private readonly records: LedgerRecord[] = [];

  async append(record: LedgerRecord): Promise<void> {
    this.records.push(structuredClone(record));
  }

  async findByCommandId(commandId: CommandId): Promise<LedgerRecord[]> {
    return this.records
      .filter((record) => record.commandId === commandId)
      .map((record) => structuredClone(record));
  }

  async findByIdempotencyKey(idempotencyKey: IdempotencyKey): Promise<LedgerRecord[]> {
    return this.records
      .filter((record) => record.idempotencyKey === idempotencyKey)
      .map((record) => structuredClone(record));
  }

  async all(): Promise<LedgerRecord[]> {
    return this.records.map((record) => structuredClone(record));
  }
}
