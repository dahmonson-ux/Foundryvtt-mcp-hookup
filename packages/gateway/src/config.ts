export interface GatewayConfig {
  host: string;
  port: number;
  logLevel: string;
  authSecret: string;
  foundryBaseUrl?: string;
  foundryBridgeSecret?: string;
  remoteGatewayUrl?: string;
  remoteGatewayToken?: string;
}

const PLACEHOLDER_PREFIX = "INSERT_";

function required(name: string, env: NodeJS.ProcessEnv): string {
  const value = env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  if (value.startsWith(PLACEHOLDER_PREFIX)) {
    throw new Error(
      `${name} still contains an example placeholder. Replace it in your local .env file.`
    );
  }

  return value;
}

function optional(name: string, env: NodeJS.ProcessEnv): string | undefined {
  const value = env[name]?.trim();

  if (!value || value.startsWith(PLACEHOLDER_PREFIX)) {
    return undefined;
  }

  return value;
}

export function loadGatewayConfig(
  env: NodeJS.ProcessEnv = process.env
): GatewayConfig {
  const rawPort = env.GATEWAY_PORT?.trim() || "3001";
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("GATEWAY_PORT must be an integer from 1 to 65535.");
  }

  return {
    host: env.GATEWAY_HOST?.trim() || "127.0.0.1",
    port,
    logLevel: env.GATEWAY_LOG_LEVEL?.trim() || "info",
    authSecret: required("GATEWAY_AUTH_SECRET", env),
    foundryBaseUrl: optional("FOUNDRY_BASE_URL", env),
    foundryBridgeSecret: optional("FOUNDRY_BRIDGE_SECRET", env),
    remoteGatewayUrl: optional("REMOTE_GATEWAY_URL", env),
    remoteGatewayToken: optional("REMOTE_GATEWAY_TOKEN", env)
  };
}
