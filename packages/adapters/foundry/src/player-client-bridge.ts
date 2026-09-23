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
import type { FoundryBridge } from "./types.js";

export interface PlayerClientSession {
  sessionId: string;
  foundryUserId: string;
  worldId: string;
  controllableActorIds: string[];
}

export type PlayerClientRequest =
  | {
      operation: "read_filtered_state";
      actorId: string;
    }
  | {
      operation: "list_legal_actions";
      actorId: string;
      state: VisibleState;
    }
  | {
      operation: "execute_action";
      actorId: string;
      action: ActionAffordance;
      commandId: CommandId;
      idempotencyKey: IdempotencyKey;
    }
  | {
      operation: "reconcile_action";
      actorId: string;
      commandId: CommandId;
      idempotencyKey: IdempotencyKey;
    }
  | {
      operation: "resolve_proposal";
      actorId: string;
      proposal: ActionProposal;
      state: VisibleState;
    };

/**
 * Transport between the local MCP/Pawn runner and the Foundry client that is
 * already open and authenticated in the player's browser.
 *
 * This interface intentionally does not contain Foundry passwords, cookies,
 * session tokens, relay API keys, or remote server credentials.
 */
export interface PlayerClientTransport {
  getSession(): Promise<PlayerClientSession>;
  request<T>(request: PlayerClientRequest): Promise<T>;
}

export interface PlayerClientBridgeConfig {
  actorId: string;
}

function required(name: string, env: NodeJS.ProcessEnv): string {
  const value = env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  if (value.startsWith("INSERT_")) {
    throw new Error(`${name} still contains an example placeholder.`);
  }

  return value;
}

/**
 * Player-client mode only needs the Actor assigned to the AI.
 * Authentication remains inside the already-authenticated Foundry browser
 * session instead of being copied into the local MCP process.
 */
export function loadPlayerClientBridgeConfig(
  env: NodeJS.ProcessEnv = process.env
): PlayerClientBridgeConfig {
  return {
    actorId: required("AI_ACTOR_UUID", env)
  };
}

/**
 * FoundryBridge implementation for the remote-player "shared controller"
 * architecture.
 *
 * Human input and AI input share the same authenticated Foundry browser
 * session. The browser-side Foundry module remains responsible for checking
 * game.user permissions and for executing only operations allowed to the
 * selected Actor.
 */
export class PlayerClientBridge implements FoundryBridge {
  constructor(
    private readonly transport: PlayerClientTransport,
    private readonly config: PlayerClientBridgeConfig
  ) {}

  async readFilteredState(identity: AgentIdentity): Promise<VisibleState> {
    await this.assertActorScope(identity);

    return this.transport.request<VisibleState>({
      operation: "read_filtered_state",
      actorId: this.config.actorId
    });
  }

  async listLegalActions(
    identity: AgentIdentity,
    state: VisibleState
  ): Promise<ActionAffordance[]> {
    await this.assertActorScope(identity);

    return this.transport.request<ActionAffordance[]>({
      operation: "list_legal_actions",
      actorId: this.config.actorId,
      state
    });
  }

  async executeAction(
    identity: AgentIdentity,
    action: ActionAffordance,
    commandId: CommandId,
    idempotencyKey: IdempotencyKey
  ): Promise<AdapterExecutionResult> {
    await this.assertActorScope(identity);

    if (action.actorId !== this.config.actorId) {
      throw new Error("Action is not scoped to the configured AI Actor.");
    }

    return this.transport.request<AdapterExecutionResult>({
      operation: "execute_action",
      actorId: this.config.actorId,
      action,
      commandId,
      idempotencyKey
    });
  }

  async reconcileAction(
    identity: AgentIdentity,
    commandId: CommandId,
    idempotencyKey: IdempotencyKey
  ): Promise<AdapterReconciliationResult> {
    await this.assertActorScope(identity);

    return this.transport.request<AdapterReconciliationResult>({
      operation: "reconcile_action",
      actorId: this.config.actorId,
      commandId,
      idempotencyKey
    });
  }

  async resolveProposal(
    identity: AgentIdentity,
    proposal: ActionProposal,
    state: VisibleState
  ): Promise<ActionAffordance | undefined> {
    await this.assertActorScope(identity);

    return this.transport.request<ActionAffordance | undefined>({
      operation: "resolve_proposal",
      actorId: this.config.actorId,
      proposal,
      state
    });
  }

  private async assertActorScope(identity: AgentIdentity): Promise<void> {
    if (identity.actorId !== this.config.actorId) {
      throw new Error("Agent identity is not assigned to the configured AI Actor.");
    }

    const session = await this.transport.getSession();

    if (!session.controllableActorIds.includes(this.config.actorId)) {
      throw new Error(
        "Configured AI Actor is not controllable by the current Foundry user."
      );
    }
  }
}
