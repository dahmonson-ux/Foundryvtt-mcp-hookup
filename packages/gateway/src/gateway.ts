import { randomUUID } from "node:crypto";
import type {
  ActionAffordance,
  ActionProposal,
  ActionResult,
  ActionSelection,
  AgentId,
  AvailableActionsResponse,
  IdempotencyKey,
  LedgerRecord,
  ProposalResult,
  ReconciliationResult,
  StateVersion
} from "@foundry-ai-gateway/contracts";
import type { AffordanceResolver } from "@foundry-ai-gateway/affordances";
import type { ActionLedger } from "@foundry-ai-gateway/ledger";
import { CapabilityAuthorizer } from "./authorization.js";
import {
  InMemoryIdempotencyStore,
  selectionFingerprint,
  type IdempotencyStore
} from "./idempotency.js";
import type { GameAdapter, IdentityProvider } from "./ports.js";
import { validateCanonicalReferences } from "./reference-policy.js";

interface OfferedAction {
  agentId: AgentId;
  action: ActionAffordance;
}

export interface GatewayDependencies {
  identityProvider: IdentityProvider;
  adapter: GameAdapter;
  resolver: AffordanceResolver;
  ledger: ActionLedger;
  authorizer?: CapabilityAuthorizer;
  idempotency?: IdempotencyStore;
}

export class GatewayCore {
  private readonly offered = new Map<string, OfferedAction>();
  private readonly authorizer: CapabilityAuthorizer;
  private readonly idempotency: IdempotencyStore;

  constructor(private readonly deps: GatewayDependencies) {
    this.authorizer = deps.authorizer ?? new CapabilityAuthorizer();
    this.idempotency = deps.idempotency ?? new InMemoryIdempotencyStore();
  }

  async getAvailableActions(
    agentId: AgentId,
    requestedStateVersion?: StateVersion
  ): Promise<AvailableActionsResponse> {
    const identity = await this.requireIdentity(agentId);
    const state = await this.deps.adapter.readVisibleState(identity);

    if (
      requestedStateVersion !== undefined &&
      requestedStateVersion !== state.stateVersion
    ) {
      // The fresh snapshot is intentionally returned instead of pretending
      // the caller's stale version is still current.
    }

    const candidates = await this.deps.adapter.listCandidateActions(identity, state);
    const actions = this.deps.resolver
      .resolve(identity, state, candidates)
      .filter((action) => validateCanonicalReferences(action).allowed);

    for (const action of actions) {
      this.offered.set(this.offerKey(agentId, action.actionId), {
        agentId,
        action: structuredClone(action)
      });
    }

    return {
      state: structuredClone(state),
      actions: structuredClone(actions)
    };
  }

  async executeAction(selection: ActionSelection): Promise<ActionResult> {
    const fingerprint = selectionFingerprint(selection);
    const existing = await this.idempotency.get(selection.idempotencyKey);

    if (existing) {
      if (existing.fingerprint !== fingerprint) {
        return {
          commandId: existing.commandId,
          idempotencyKey: selection.idempotencyKey,
          actionId: selection.actionId,
          status: "REJECTED",
          code: "IDEMPOTENCY_KEY_REUSED",
          message: "This idempotency key belongs to a different request."
        };
      }

      await this.appendLedger({
        commandId: existing.commandId,
        idempotencyKey: existing.key,
        agentId: existing.agentId,
        actorId: (await this.requireIdentity(existing.agentId)).actorId,
        actionId: existing.selection.actionId,
        stateVersion: existing.selection.stateVersion,
        status: "DUPLICATE_SUPPRESSED",
        metadata: { originalStatus: existing.result.status }
      });

      return {
        ...existing.result,
        duplicateOfCommandId: existing.commandId
      };
    }

    const identity = await this.requireIdentity(selection.agentId);
    const commandId = `cmd_${randomUUID()}`;
    const offered = this.offered.get(
      this.offerKey(selection.agentId, selection.actionId)
    );

    if (!offered) {
      return this.rejectAndRemember(
        identity.agentId,
        identity.actorId,
        commandId,
        selection,
        fingerprint,
        "ACTION_NOT_OFFERED",
        "The action is not available for this agent."
      );
    }

    const state = await this.deps.adapter.readVisibleState(identity);
    const action = offered.action;

    if (
      state.stateVersion !== selection.stateVersion ||
      action.stateVersion !== selection.stateVersion ||
      action.expiresAtStateVersion !== state.stateVersion ||
      (action.turnId !== undefined && action.turnId !== state.turnId)
    ) {
      return this.rejectAndRemember(
        identity.agentId,
        identity.actorId,
        commandId,
        selection,
        fingerprint,
        "STALE_STATE",
        "The action expired because authoritative state changed."
      );
    }

    const referenceDecision = validateCanonicalReferences(action);
    if (!referenceDecision.allowed) {
      return this.rejectAndRemember(
        identity.agentId,
        identity.actorId,
        commandId,
        selection,
        fingerprint,
        referenceDecision.code ?? "CANONICAL_REFERENCE_REQUIRED",
        referenceDecision.reason ?? "Canonical reference validation failed.",
        referenceDecision
      );
    }

    const authorization = this.authorizer.authorize(identity, action);
    if (!authorization.allowed) {
      return this.rejectAndRemember(
        identity.agentId,
        identity.actorId,
        commandId,
        selection,
        fingerprint,
        authorization.code ?? "CAPABILITY_DENIED",
        authorization.reason ?? "Action denied.",
        authorization
      );
    }

    if (authorization.code === "APPROVAL_REQUIRED") {
      return this.rejectAndRemember(
        identity.agentId,
        identity.actorId,
        commandId,
        selection,
        fingerprint,
        "APPROVAL_REQUIRED",
        authorization.reason ?? "Human approval is required.",
        authorization
      );
    }

    await this.appendLedger({
      commandId,
      idempotencyKey: selection.idempotencyKey,
      agentId: identity.agentId,
      actorId: identity.actorId,
      actionId: action.actionId,
      actionType: action.type,
      stateVersion: state.stateVersion,
      turnId: state.turnId,
      status: "AUTHORIZED",
      policyVersion: identity.policyVersion,
      rationale: selection.rationale,
      decision: authorization,
      referenceIds: action.references?.map((reference) => reference.referenceId)
    });

    await this.appendLedger({
      commandId,
      idempotencyKey: selection.idempotencyKey,
      agentId: identity.agentId,
      actorId: identity.actorId,
      actionId: action.actionId,
      actionType: action.type,
      stateVersion: state.stateVersion,
      turnId: state.turnId,
      status: "VALIDATED",
      policyVersion: identity.policyVersion,
      referenceIds: action.references?.map((reference) => reference.referenceId)
    });

    await this.appendLedger({
      commandId,
      idempotencyKey: selection.idempotencyKey,
      agentId: identity.agentId,
      actorId: identity.actorId,
      actionId: action.actionId,
      actionType: action.type,
      stateVersion: state.stateVersion,
      turnId: state.turnId,
      status: "EXECUTING",
      policyVersion: identity.policyVersion,
      referenceIds: action.references?.map((reference) => reference.referenceId)
    });

    let result: ActionResult;

    try {
      const adapterResult = await this.deps.adapter.execute(
        identity,
        action,
        commandId,
        selection.idempotencyKey
      );

      result = {
        commandId,
        idempotencyKey: selection.idempotencyKey,
        actionId: action.actionId,
        status: adapterResult.status,
        stateVersionBefore: state.stateVersion,
        stateVersionAfter: adapterResult.stateVersionAfter,
        authorization,
        legality: { allowed: adapterResult.status !== "FAILED" },
        tablePolicy: { requiresHumanApproval: false },
        resultId: adapterResult.resultId,
        consequences: adapterResult.consequences,
        code: adapterResult.code,
        message: adapterResult.message
      };
    } catch (error) {
      result = {
        commandId,
        idempotencyKey: selection.idempotencyKey,
        actionId: action.actionId,
        status: "FAILED",
        stateVersionBefore: state.stateVersion,
        authorization,
        code: "ADAPTER_ERROR",
        message: error instanceof Error ? error.message : "Adapter execution failed."
      };
    }

    await this.idempotency.set({
      agentId: selection.agentId,
      commandId,
      key: selection.idempotencyKey,
      fingerprint,
      selection: structuredClone(selection),
      result: structuredClone(result)
    });

    await this.appendLedger({
      commandId,
      idempotencyKey: selection.idempotencyKey,
      agentId: identity.agentId,
      actorId: identity.actorId,
      actionId: action.actionId,
      actionType: action.type,
      stateVersion: result.stateVersionAfter ?? state.stateVersion,
      turnId: state.turnId,
      status: result.status,
      policyVersion: identity.policyVersion,
      rationale: selection.rationale,
      resultId: result.resultId,
      referenceIds: action.references?.map((reference) => reference.referenceId),
      metadata: result.code ? { code: result.code } : undefined
    });

    return result;
  }

  async proposeAction(
    agentId: AgentId,
    proposal: ActionProposal,
    stateVersion: StateVersion,
    idempotencyKey: IdempotencyKey
  ): Promise<ProposalResult> {
    const identity = await this.requireIdentity(agentId);
    const state = await this.deps.adapter.readVisibleState(identity);
    const commandId = `cmd_${randomUUID()}`;

    if (state.stateVersion !== stateVersion) {
      const rejected: ProposalResult = {
        commandId,
        status: "REJECTED",
        proposal,
        decision: {
          allowed: false,
          code: "STALE_STATE",
          reason: "Proposal was based on stale state.",
          policyVersion: identity.policyVersion
        }
      };

      await this.appendLedger({
        commandId,
        idempotencyKey,
        agentId,
        actorId: identity.actorId,
        stateVersion,
        status: "REJECTED",
        policyVersion: identity.policyVersion,
        rationale: proposal.rationale,
        decision: rejected.decision
      });

      return rejected;
    }

    const action = await this.deps.adapter.resolveProposal?.(
      identity,
      proposal,
      state
    );

    const result: ProposalResult = {
      commandId,
      status: "PROPOSED",
      proposal,
      action
    };

    await this.appendLedger({
      commandId,
      idempotencyKey,
      agentId,
      actorId: identity.actorId,
      stateVersion,
      actionId: action?.actionId,
      actionType: proposal.type,
      status: "PROPOSED",
      policyVersion: identity.policyVersion,
      rationale: proposal.rationale
    });

    return result;
  }

  async reconcileAction(
    commandId: string,
    idempotencyKey: IdempotencyKey
  ): Promise<ReconciliationResult> {
    const entry = await this.idempotency.get(idempotencyKey);

    if (!entry || entry.commandId !== commandId) {
      return {
        commandId,
        idempotencyKey,
        status: "UNKNOWN"
      };
    }

    if (entry.result.status === "SUCCEEDED" || entry.result.status === "FAILED") {
      return {
        commandId,
        idempotencyKey,
        status: entry.result.status,
        result: entry.result
      };
    }

    if (entry.result.status !== "UNKNOWN") {
      return {
        commandId,
        idempotencyKey,
        status: "FAILED",
        result: entry.result
      };
    }

    const identity = await this.requireIdentity(entry.agentId);
    const reconciled = await this.deps.adapter.reconcile(
      identity,
      commandId,
      idempotencyKey
    );

    if (reconciled.status === "UNKNOWN") {
      return {
        commandId,
        idempotencyKey,
        status: "UNKNOWN",
        result: entry.result
      };
    }

    const result: ActionResult = {
      ...entry.result,
      status: reconciled.status,
      stateVersionAfter:
        reconciled.stateVersionAfter ?? entry.result.stateVersionAfter,
      resultId: reconciled.resultId ?? entry.result.resultId,
      consequences: reconciled.consequences ?? entry.result.consequences,
      code: reconciled.code,
      message: reconciled.message
    };

    await this.idempotency.set({
      ...entry,
      result
    });

    await this.appendLedger({
      commandId,
      idempotencyKey,
      agentId: identity.agentId,
      actorId: identity.actorId,
      actionId: entry.selection.actionId,
      stateVersion: result.stateVersionAfter,
      status: "RECONCILED",
      policyVersion: identity.policyVersion,
      resultId: result.resultId,
      metadata: { finalStatus: result.status }
    });

    return {
      commandId,
      idempotencyKey,
      status: result.status === "SUCCEEDED" ? "SUCCEEDED" : "FAILED",
      result
    };
  }

  private async rejectAndRemember(
    agentId: string,
    actorId: string,
    commandId: string,
    selection: ActionSelection,
    fingerprint: string,
    code: string,
    message: string,
    authorization?: ActionResult["authorization"]
  ): Promise<ActionResult> {
    const result: ActionResult = {
      commandId,
      idempotencyKey: selection.idempotencyKey,
      actionId: selection.actionId,
      status: "REJECTED",
      stateVersionBefore: selection.stateVersion,
      authorization,
      code,
      message
    };

    await this.idempotency.set({
      agentId,
      commandId,
      key: selection.idempotencyKey,
      fingerprint,
      selection: structuredClone(selection),
      result: structuredClone(result)
    });

    await this.appendLedger({
      commandId,
      idempotencyKey: selection.idempotencyKey,
      agentId,
      actorId,
      actionId: selection.actionId,
      stateVersion: selection.stateVersion,
      status: "REJECTED",
      rationale: selection.rationale,
      decision: authorization,
      metadata: { code }
    });

    return result;
  }

  private async requireIdentity(agentId: AgentId) {
    const identity = await this.deps.identityProvider.resolve(agentId);
    if (!identity) {
      throw new Error("Unknown or unauthenticated agent.");
    }
    return identity;
  }

  private offerKey(agentId: AgentId, actionId: string): string {
    return `${agentId}:${actionId}`;
  }

  private async appendLedger(
    partial: Omit<LedgerRecord, "ledgerId" | "timestamp">
  ): Promise<void> {
    await this.deps.ledger.append({
      ...partial,
      ledgerId: `ledger_${randomUUID()}`,
      timestamp: new Date().toISOString()
    });
  }
}
