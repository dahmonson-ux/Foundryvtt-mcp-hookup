import type {
  ActionAffordance,
  ActionProposal,
  AgentId,
  AgentIdentity,
  CommandId,
  Consequence,
  IdempotencyKey,
  StateVersion,
  VisibleState
} from "@foundry-ai-gateway/contracts";

export interface IdentityProvider {
  resolve(agentId: AgentId): Promise<AgentIdentity | undefined>;
}

export interface AdapterExecutionResult {
  status: "SUCCEEDED" | "FAILED" | "UNKNOWN";
  stateVersionAfter?: StateVersion;
  resultId?: string;
  consequences?: Consequence[];
  code?: string;
  message?: string;
}

export interface AdapterReconciliationResult {
  status: "SUCCEEDED" | "FAILED" | "UNKNOWN";
  stateVersionAfter?: StateVersion;
  resultId?: string;
  consequences?: Consequence[];
  code?: string;
  message?: string;
}

export interface GameAdapter {
  readVisibleState(identity: AgentIdentity): Promise<VisibleState>;
  listCandidateActions(
    identity: AgentIdentity,
    state: VisibleState
  ): Promise<ActionAffordance[]>;
  execute(
    identity: AgentIdentity,
    action: ActionAffordance,
    commandId: CommandId,
    idempotencyKey: IdempotencyKey
  ): Promise<AdapterExecutionResult>;
  reconcile(
    identity: AgentIdentity,
    commandId: CommandId,
    idempotencyKey: IdempotencyKey
  ): Promise<AdapterReconciliationResult>;
  resolveProposal?(
    identity: AgentIdentity,
    proposal: ActionProposal,
    state: VisibleState
  ): Promise<ActionAffordance | undefined>;
}
