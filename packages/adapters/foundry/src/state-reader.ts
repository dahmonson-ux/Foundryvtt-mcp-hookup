import type {
  ActionAffordance,
  ActionProposal,
  AgentIdentity,
  CommandId,
  IdempotencyKey,
  VisibleState
} from "@foundry-ai-gateway/contracts";
import type {
  AdapterExecutionResult,
  AdapterReconciliationResult,
  GameAdapter
} from "@foundry-ai-gateway/gateway";
import type { FoundryBridge } from "./types.js";

export class FoundryGameAdapter implements GameAdapter {
  constructor(private readonly bridge: FoundryBridge) {}

  readVisibleState(identity: AgentIdentity): Promise<VisibleState> {
    return this.bridge.readFilteredState(identity);
  }

  listCandidateActions(
    identity: AgentIdentity,
    state: VisibleState
  ): Promise<ActionAffordance[]> {
    return this.bridge.listLegalActions(identity, state);
  }

  execute(
    identity: AgentIdentity,
    action: ActionAffordance,
    commandId: CommandId,
    idempotencyKey: IdempotencyKey
  ): Promise<AdapterExecutionResult> {
    return this.bridge.executeAction(
      identity,
      action,
      commandId,
      idempotencyKey
    );
  }

  reconcile(
    identity: AgentIdentity,
    commandId: CommandId,
    idempotencyKey: IdempotencyKey
  ): Promise<AdapterReconciliationResult> {
    return this.bridge.reconcileAction(identity, commandId, idempotencyKey);
  }

  resolveProposal(
    identity: AgentIdentity,
    proposal: ActionProposal,
    state: VisibleState
  ): Promise<ActionAffordance | undefined> {
    if (!this.bridge.resolveProposal) {
      return Promise.resolve(undefined);
    }
    return this.bridge.resolveProposal(identity, proposal, state);
  }
}
