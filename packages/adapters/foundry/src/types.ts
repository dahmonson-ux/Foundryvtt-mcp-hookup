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
  AdapterReconciliationResult
} from "@foundry-ai-gateway/gateway";

export interface FoundryBridge {
  /**
   * Return state already filtered for this identity.
   * Raw GM-only documents must not cross this boundary.
   */
  readFilteredState(identity: AgentIdentity): Promise<VisibleState>;

  /**
   * Return legal candidate actions derived from current Foundry/game-system state.
   * The gateway resolver will still apply capability and state-bound filtering.
   */
  listLegalActions(
    identity: AgentIdentity,
    state: VisibleState
  ): Promise<ActionAffordance[]>;

  executeAction(
    identity: AgentIdentity,
    action: ActionAffordance,
    commandId: CommandId,
    idempotencyKey: IdempotencyKey
  ): Promise<AdapterExecutionResult>;

  reconcileAction(
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
