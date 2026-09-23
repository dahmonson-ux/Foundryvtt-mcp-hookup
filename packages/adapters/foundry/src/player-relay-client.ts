export interface PlayerRelayConfig {
  baseUrl: string;
  apiKey: string;
  actorUuid: string;
}

export interface PlayerRelayClientOptions extends PlayerRelayConfig {
  fetchImpl?: typeof fetch;
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
 * Load the remote-player relay configuration.
 *
 * This configuration is only needed when a player's AI/Pawn runs on another
 * computer and reaches Foundry through the existing player-facing REST relay.
 * Local/solo deployments do not need these values.
 */
export function loadPlayerRelayConfig(
  env: NodeJS.ProcessEnv = process.env
): PlayerRelayConfig {
  return {
    baseUrl: required("FOUNDRY_RELAY_URL", env),
    apiKey: required("FOUNDRY_RELAY_API_KEY", env),
    actorUuid: required("AI_ACTOR_UUID", env)
  };
}

/**
 * Small HTTP helper for existing remote-player/Pawn scripts.
 *
 * The relay API key is expected to be scoped to the player's Foundry user and
 * world. This client deliberately does not send clientId or userId overrides.
 * Foundry/relay permissions remain authoritative.
 *
 * This is not a full Pawn runner and does not expose arbitrary execute-js.
 * Existing player scripts can use request() for the specific API operations
 * they already implement.
 */
export class PlayerRelayClient {
  readonly actorUuid: string;

  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: PlayerRelayClientOptions) {
    this.baseUrl = options.baseUrl.endsWith("/")
      ? options.baseUrl
      : `${options.baseUrl}/`;
    this.apiKey = options.apiKey;
    this.actorUuid = options.actorUuid;
    this.fetchImpl = options.fetchImpl ?? fetch;

    if (!this.baseUrl || !this.apiKey || !this.actorUuid) {
      throw new Error("baseUrl, apiKey, and actorUuid are required.");
    }
  }

  /**
   * Read the Actor assigned to the AI using the relay's normal permission
   * filtering. If the scoped player key cannot see the Actor, this call fails.
   */
  getAssignedActor<T = unknown>(): Promise<T> {
    const url = new URL("get", this.baseUrl);
    url.searchParams.set("uuid", this.actorUuid);
    return this.requestUrl<T>(url);
  }

  /**
   * Generic request helper for the existing player scripts.
   *
   * Keep action-specific logic in those scripts or in an adapter above this
   * helper. The scoped API key is attached to every request.
   */
  request<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
    return this.requestUrl<T>(new URL(path, this.baseUrl), init);
  }

  private async requestUrl<T>(
    url: URL,
    init: RequestInit = {}
  ): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("x-api-key", this.apiKey);

    const response = await this.fetchImpl(url, {
      ...init,
      headers
    });

    if (!response.ok) {
      throw new Error(
        `Foundry player relay request failed: ${response.status} ${response.statusText}`
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}
