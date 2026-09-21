export type AgentId = string;
export type ActorId = string;
export type ActionId = string;
export type CommandId = string;
export type EventId = string;
export type IdempotencyKey = string;
export type StateVersion = number;
export type TurnId = string;

export type GameMode = "combat" | "world";

export type CommandStatus =
  | "PROPOSED"
  | "AUTHORIZED"
  | "VALIDATED"
  | "EXECUTING"
  | "SUCCEEDED"
  | "REJECTED"
  | "FAILED"
  | "UNKNOWN";

export interface CapabilityRule {
  capability: string;
  scope: string;
  targets?: string;
  requiresApproval?: boolean;
}

export interface AgentIdentity {
  agentId: AgentId;
  actorId: ActorId;
  policyVersion: number;
  capabilities: CapabilityRule[];
}

export interface VisibleState {
  stateVersion: StateVersion;
  turnId?: TurnId;
  mode: GameMode;
  data: Record<string, unknown>;
}

export interface ActionCost {
  action?: number;
  bonusAction?: number;
  reaction?: number;
  movement?: number;
  [resource: string]: number | undefined;
}

export interface ApprovalMetadata {
  required: boolean;
  reason?: string;
  policyId?: string;
}

export interface ActionAffordance {
  actionId: ActionId;
  contractVersion: number;
  type: string;
  actorId: ActorId;
  targetId?: string;
  abilityId?: string;
  itemId?: string;
  destination?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
  costs?: ActionCost;
  requirements?: Record<string, unknown>;
  scope?: Record<string, string>;
  stateVersion: StateVersion;
  turnId?: TurnId;
  expiresAtStateVersion: StateVersion;
  approval?: ApprovalMetadata;
}

export interface AvailableActionsResponse {
  state: VisibleState;
  actions: ActionAffordance[];
}

export interface StructuredRationale {
  summary: string;
  tags?: string[];
}

export interface ActionProposal {
  type: string;
  parameters?: Record<string, unknown>;
  rationale?: StructuredRationale;
}

export interface ActionSelection {
  agentId: AgentId;
  actionId: ActionId;
  stateVersion: StateVersion;
  idempotencyKey: IdempotencyKey;
  rationale?: StructuredRationale;
}

export interface GatewayDecision {
  allowed: boolean;
  code?: string;
  reason?: string;
  policyVersion?: number;
}

export interface Consequence {
  type: string;
  data?: Record<string, unknown>;
}

export interface ActionResult {
  commandId: CommandId;
  idempotencyKey: IdempotencyKey;
  actionId?: ActionId;
  status: CommandStatus;
  stateVersionBefore?: StateVersion;
  stateVersionAfter?: StateVersion;
  authorization?: GatewayDecision;
  legality?: GatewayDecision;
  tablePolicy?: {
    requiresHumanApproval: boolean;
    reason?: string;
  };
  resultId?: string;
  consequences?: Consequence[];
  code?: string;
  message?: string;
  duplicateOfCommandId?: CommandId;
}

export interface ProposalResult {
  commandId: CommandId;
  status: "PROPOSED" | "REJECTED";
  proposal: ActionProposal;
  action?: ActionAffordance;
  decision?: GatewayDecision;
}

export interface ReconciliationResult {
  commandId: CommandId;
  idempotencyKey: IdempotencyKey;
  status: "SUCCEEDED" | "FAILED" | "UNKNOWN";
  result?: ActionResult;
}

export interface GatewayEvent {
  eventId: EventId;
  aggregateId: string;
  sequence: number;
  stateVersion: StateVersion;
  causationId?: string;
  correlationId?: string;
  type: string;
  payload: Record<string, unknown>;
}

export interface LedgerRecord {
  ledgerId: string;
  timestamp: string;
  commandId?: CommandId;
  idempotencyKey?: IdempotencyKey;
  agentId: AgentId;
  actorId: ActorId;
  stateVersion?: StateVersion;
  turnId?: TurnId;
  actionId?: ActionId;
  actionType?: string;
  status: CommandStatus | "DUPLICATE_SUPPRESSED" | "RECONCILED";
  policyVersion?: number;
  rationale?: StructuredRationale;
  decision?: GatewayDecision;
  resultId?: string;
  correlationId?: string;
  causationId?: string;
  metadata?: Record<string, unknown>;
}
