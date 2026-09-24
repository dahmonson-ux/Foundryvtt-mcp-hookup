const MODULE_ID = "ai-pawn-phase1-spike";

let socket;
let revision = 1;
let reconnectTimer;
const pendingEvents = [];

function bumpRevision() {
  revision += 1;
}

function setting(key) {
  return game.settings.get(MODULE_ID, key);
}

function plainText(html) {
  const node = document.createElement("div");
  node.innerHTML = String(html ?? "");
  return (node.textContent ?? "").trim();
}

function sanitizeMessage(message) {
  if (!message?.visible || !message?.isContentVisible) return undefined;

  return {
    id: message.id,
    timestamp: message.timestamp,
    speaker: {
      actor: message.speaker?.actor,
      token: message.speaker?.token,
      alias: message.speaker?.alias
    },
    text: plainText(message.content)
  };
}

async function assignedActor() {
  const uuid = String(setting("actorUuid") ?? "").trim();
  if (!uuid) throw new Error("Pawn Actor UUID is not configured.");

  const actor = await fromUuid(uuid);
  if (!actor || actor.documentName !== "Actor") {
    throw new Error("Configured Pawn UUID did not resolve to an Actor.");
  }

  if (!actor.isOwner) {
    throw new Error("Current Foundry user does not own the configured Pawn Actor.");
  }

  return actor;
}

async function assignedToken(actor) {
  const tokens = canvas?.tokens?.placeables ?? [];
  const token = tokens.find((candidate) => {
    const doc = candidate.document;
    return doc?.actorId === actor.id && doc.isOwner;
  });

  return token;
}

function visibleTokens() {
  return (canvas?.tokens?.placeables ?? [])
    .filter((token) => token.visible && !token.document?.hidden)
    .map((token) => ({
      id: token.id,
      actorId: token.document?.actorId,
      name: token.name,
      x: token.document?.x,
      y: token.document?.y,
      elevation: token.document?.elevation,
      disposition: token.document?.disposition
    }));
}

function recentConversation(limit = 20) {
  return (game.messages?.contents ?? [])
    .filter((message) => message.visible && message.isContentVisible)
    .slice(-limit)
    .map(sanitizeMessage)
    .filter(Boolean);
}

async function snapshot() {
  const actor = await assignedActor();
  const token = await assignedToken(actor);
  const actorData = actor.toObject(false);

  return {
    revision,
    capturedAt: new Date().toISOString(),
    foundry: {
      version: game.version,
      worldId: game.world?.id,
      systemId: game.system?.id,
      systemVersion: game.system?.version
    },
    user: {
      id: game.user?.id,
      isGM: Boolean(game.user?.isGM)
    },
    actor: {
      id: actor.id,
      uuid: actor.uuid,
      name: actor.name,
      type: actor.type,
      isOwner: actor.isOwner,
      system: actorData.system
    },
    scene: canvas?.scene
      ? {
          id: canvas.scene.id,
          name: canvas.scene.name
        }
      : undefined,
    token: token
      ? {
          id: token.id,
          uuid: token.document.uuid,
          name: token.name,
          x: token.document.x,
          y: token.document.y,
          elevation: token.document.elevation,
          isOwner: token.document.isOwner
        }
      : undefined,
    visibleTokens: visibleTokens(),
    conversation: recentConversation()
  };
}

async function speak(text) {
  const actor = await assignedActor();
  const token = await assignedToken(actor);
  const value = String(text ?? "").trim();

  if (!value) throw new Error("Speech text is required.");

  const p = document.createElement("p");
  p.textContent = value;

  const message = await ChatMessage.create({
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({
      actor,
      token: token?.document,
      scene: canvas?.scene
    }),
    content: p.outerHTML
  });

  return {
    messageId: message?.id,
    snapshot: await snapshot()
  };
}

async function move(x, y) {
  const actor = await assignedActor();
  const token = await assignedToken(actor);

  if (!token) throw new Error("The configured Pawn has no owned token on the current canvas.");
  if (!token.document.isOwner) {
    throw new Error("Current Foundry user does not own the Pawn token.");
  }

  const nx = Number(x);
  const ny = Number(y);
  if (!Number.isFinite(nx) || !Number.isFinite(ny)) {
    throw new Error("Move requires finite numeric x and y coordinates.");
  }

  const completed = await token.document.move(
    { x: nx, y: ny },
    { showRuler: false }
  );

  if (!completed) {
    throw new Error("Foundry did not complete the token movement.");
  }

  return {
    completed,
    snapshot: await snapshot()
  };
}

async function handleCommand(message) {
  const { id, operation, payload = {} } = message ?? {};
  if (!id || !operation) return;

  try {
    let result;

    switch (operation) {
      case "snapshot":
        result = await snapshot();
        break;
      case "conversation":
        result = recentConversation(Number(payload.limit) || 20);
        break;
      case "speak":
        result = await speak(payload.text);
        break;
      case "move":
        result = await move(payload.x, payload.y);
        break;
      default:
        throw new Error(`Unsupported Phase 1 operation: ${operation}`);
    }

    send({
      type: "response",
      id,
      ok: true,
      result
    });
  } catch (error) {
    send({
      type: "response",
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

function send(payload) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
    return true;
  }

  if (payload.type === "event") {
    pendingEvents.push(payload);
    if (pendingEvents.length > 50) pendingEvents.shift();
  }

  return false;
}

function flushPendingEvents() {
  while (pendingEvents.length > 0 && socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(pendingEvents.shift()));
  }
}

function connect() {
  clearTimeout(reconnectTimer);

  if (!setting("enabled")) return;

  const url = String(setting("bridgeUrl") ?? "").trim();
  if (!url) {
    ui.notifications?.warn("AI Pawn Phase 1: local bridge URL is empty.");
    return;
  }

  try {
    socket = new WebSocket(url);
  } catch (error) {
    console.error("AI Pawn Phase 1: failed to create WebSocket", error);
    scheduleReconnect();
    return;
  }

  socket.addEventListener("open", async () => {
    console.info("AI Pawn Phase 1: local bridge connected.");

    let actor;
    let actorError;
    try {
      actor = await assignedActor();
    } catch (error) {
      actorError = error instanceof Error ? error.message : String(error);
    }

    send({
      type: "hello",
      protocol: 1,
      userId: game.user?.id,
      isGM: Boolean(game.user?.isGM),
      actorId: actor?.id,
      actorUuid: actor?.uuid,
      actorOwned: Boolean(actor?.isOwner),
      actorError
    });

    flushPendingEvents();
  });

  socket.addEventListener("message", async (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message?.type === "command") {
        await handleCommand(message);
      }
    } catch (error) {
      console.error("AI Pawn Phase 1: invalid bridge message", error);
    }
  });

  socket.addEventListener("close", () => {
    console.warn("AI Pawn Phase 1: local bridge disconnected.");
    scheduleReconnect();
  });

  socket.addEventListener("error", (error) => {
    console.error("AI Pawn Phase 1: WebSocket error", error);
  });
}

function scheduleReconnect() {
  clearTimeout(reconnectTimer);
  if (!setting("enabled")) return;
  reconnectTimer = setTimeout(connect, 3000);
}

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "enabled", {
    name: "Enable Phase 1 Spike",
    hint: "Connect this browser client to the disposable local Phase 1 probe.",
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register(MODULE_ID, "actorUuid", {
    name: "Pawn Actor UUID",
    hint: "The one Actor this AI connection is allowed to use.",
    scope: "client",
    config: true,
    type: String,
    default: ""
  });

  game.settings.register(MODULE_ID, "bridgeUrl", {
    name: "Local Bridge URL",
    hint: "Disposable Phase 1 bridge endpoint. Keep it loopback-only for this spike.",
    scope: "client",
    config: true,
    type: String,
    default: "ws://127.0.0.1:3001/foundry"
  });
});

Hooks.once("ready", () => {
  connect();
});

Hooks.on("updateActor", () => bumpRevision());
Hooks.on("updateToken", () => bumpRevision());
Hooks.on("updateCombat", () => bumpRevision());
Hooks.on("createCombat", () => bumpRevision());
Hooks.on("deleteCombat", () => bumpRevision());

Hooks.on("createChatMessage", (message) => {
  bumpRevision();
  const sanitized = sanitizeMessage(message);
  if (!sanitized) return;

  send({
    type: "event",
    event: "conversation",
    revision,
    message: sanitized
  });
});
