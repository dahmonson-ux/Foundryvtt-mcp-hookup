import { randomUUID } from "node:crypto";
import type {
  ActionAffordance,
  ActionProposal,
  AgentId,
  AgentIdentity,
  CommandId,
  IdempotencyKey,
  VisibleState
} from "@foundry-ai-gateway/contracts";
import type {
  AdapterExecutionResult,
  AdapterReconciliationResult,
  GameAdapter,
  IdentityProvider
} from "@foundry-ai-gateway/gateway";

export class StaticIdentityProvider implements IdentityProvider {
  private readonly identities = new Map<AgentId, AgentIdentity>();

  constructor(identities: readonly AgentIdentity[]) {
    for (const identity of identities) {
      this.identities.set(identity.agentId, structuredClone(identity));
    }
  }

  async resolve(agentId: AgentId): Promise<AgentIdentity | undefined> {
    const identity = this.identities.get(agentId);
    return identity ? structuredClone(identity) : undefined;
  }
}

export interface MockAdapterOptions {
  actorId?: string;
  targetId?: string;
  stateVersion?: number;
  turnId?: string;
}

export class MockGameAdapter implements GameAdapter {
  private actorId: string;
  private targetId: string;
  private stateVersion: number;
  private turnId: string;
  private unknownNextExecution = false;
  private readonly reconciled = new Map<CommandId, AdapterReconciliationResult>();

  executionCount = 0;

  constructor(options: MockAdapterOptions = {}) {
    this.actorId = options.actorId ?? "actor_pawn";
    this.targetId = options.targetId ?? "entity_hostile_7";
    this.stateVersion = options.stateVersion ?? 1;
    this.turnId = options.turnId ?? "turn_1";
  }

  async readVisibleState(identity: AgentIdentity): Promise<VisibleState> {
    return {
      stateVersion: this.stateVersion,
      turnId: this.turnId,
      mode: "combat",
      data: {
        self: { actorId: identity.actorId },
        visibleHostiles: [{ entityId: this.targetId }]
      }
    };
  }

  async listCandidateActions(
    identity: AgentIdentity,
    state: VisibleState
  ): Promise<ActionAffordance[]> {
    const base = {
      contractVersion: 1,
      actorId: identity.actorId,
      stateVersion: state.stateVersion,
      turnId: state.turnId,
      expiresAtStateVersion: state.stateVersion,
      approval: { required: false }
    };

    return [
      {
        ...base,
        actionId: `act_move_${state.stateVersion}`,
        type: "combat.move",
        destination: { x: 14, y: 8 },
        costs: { movement: 20 }
      },
      {
        ...base,
        actionId: `act_attack_${state.stateVersion}`,
        type: "combat.attack",
        targetId: this.targetId,
        abilityId: "ability_longsword",
        costs: { action: 1 },
        scope: { target: "visible_hostile" }
      },
      {
        ...base,
        actionId: `act_spell_${state.stateVersion}`,
        type: "combat.cast_spell",
        targetId: this.targetId,
        abilityId: "spell_example",
        costs: { action: 1 }
      },
      {
        ...base,
        actionId: `act_ability_${state.stateVersion}`,
        type: "combat.use_ability",
        abilityId: "ability_example",
        costs: { action: 1 }
      },
      {
        ...base,
        actionId: `act_item_${state.stateVersion}`,
        type: "combat.use_item",
        itemId: "item_example",
        costs: { action: 1 }
      },
      {
        ...base,
        actionId: `act_speak_${state.stateVersion}`,
        type: "combat.speak",
        parameters: { channel: "character" }
      },
      {
        ...base,
        actionId: `act_wait_${state.stateVersion}`,
        type: "combat.wait"
      },
      {
        ...base,
        actionId: `act_end_${state.stateVersion}`,
        type: "combat.end_turn"
      }
    ];
  }

  async execute(
    _identity: AgentIdentity,
    action: ActionAffordance,
    commandId: CommandId,
    _idempotencyKey: IdempotencyKey
  ): Promise<AdapterExecutionResult> {
    this.executionCount += 1;

    const before = this.stateVersion;
    this.stateVersion += 1;

    const actual: AdapterReconciliationResult = {
      status: "SUCCEEDED",
      stateVersionAfter: this.stateVersion,
      resultId: `result_${randomUUID()}`,
      consequences:
        action.type === "combat.attack"
          ? [{ type: "damage_applied", data: { targetId: action.targetId } }]
          : [{ type: "state_changed", data: { actionType: action.type } }]
    };

    this.reconciled.set(commandId, actual);

    if (this.unknownNextExecution) {
      this.unknownNextExecution = false;
      return {
        status: "UNKNOWN",
        stateVersionAfter: before,
        code: "TRANSPORT_OUTCOME_UNKNOWN",
        message: "Execution may have completed; reconcile before retrying."
      };
    }

    return actual;
  }

  async reconcile(
    _identity: AgentIdentity,
    commandId: CommandId,
    _idempotencyKey: IdempotencyKey
  ): Promise<AdapterReconciliationResult> {
    return (
      this.reconciled.get(commandId) ?? {
        status: "UNKNOWN",
        code: "NO_EXECUTION_RECEIPT"
      }
    );
  }

  async resolveProposal(
    identity: AgentIdentity,
    proposal: ActionProposal,
    state: VisibleState
  ): Promise<ActionAffordance | undefined> {
    if (proposal.type !== "combat.improvise") return undefined;

    return {
      actionId: `act_proposal_${randomUUID()}`,
      contractVersion: 1,
      type: proposal.type,
      actorId: identity.actorId,
      parameters: proposal.parameters,
      stateVersion: state.stateVersion,
      turnId: state.turnId,
      expiresAtStateVersion: state.stateVersion,
      approval: { required: true, reason: "Improvised action requires review." }
    };
  }

  simulateExternalChange(): void {
    this.stateVersion += 1;
  }

  setUnknownNextExecution(): void {
    this.unknownNextExecution = true;
  }
}
