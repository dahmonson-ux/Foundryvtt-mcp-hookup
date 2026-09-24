import http from "node:http";
import { randomUUID } from "node:crypto";
import { WebSocketServer, WebSocket } from "ws";

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT ?? 3001);

let foundrySocket;
let hello;
const pending = new Map();
const events = [];

function json(res, status, body) {
  const data = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(data)
  });
  res.end(data);
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function requestFoundry(operation, payload = {}, timeoutMs = 10000) {
  if (!foundrySocket || foundrySocket.readyState !== WebSocket.OPEN) {
    return Promise.reject(new Error("No Foundry player client is connected."));
  }

  const id = randomUUID();

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Foundry command timed out: ${operation}`));
    }, timeoutMs);

    pending.set(id, {
      resolve: (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      reject: (error) => {
        clearTimeout(timeout);
        reject(error);
      }
    });

    foundrySocket.send(JSON.stringify({
      type: "command",
      id,
      operation,
      payload
    }));
  });
}

function handleFoundryMessage(raw) {
  let message;
  try {
    message = JSON.parse(raw.toString());
  } catch {
    return;
  }

  if (message.type === "hello") {
    hello = message;
    console.log("Foundry client connected:", {
      userId: hello.userId,
      isGM: hello.isGM,
      actorUuid: hello.actorUuid,
      actorOwned: hello.actorOwned,
      actorError: hello.actorError
    });
    return;
  }

  if (message.type === "event") {
    events.push({
      receivedAt: new Date().toISOString(),
      ...message
    });
    if (events.length > 100) events.shift();
    console.log("Foundry event:", message.event);
    return;
  }

  if (message.type === "response") {
    const waiter = pending.get(message.id);
    if (!waiter) return;

    pending.delete(message.id);

    if (message.ok) waiter.resolve(message.result);
    else waiter.reject(new Error(message.error ?? "Foundry command failed."));
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);

    if (req.method === "GET" && url.pathname === "/status") {
      return json(res, 200, {
        listening: true,
        foundryConnected: Boolean(
          foundrySocket && foundrySocket.readyState === WebSocket.OPEN
        ),
        hello
      });
    }

    if (req.method === "GET" && url.pathname === "/snapshot") {
      return json(res, 200, await requestFoundry("snapshot"));
    }

    if (req.method === "GET" && url.pathname === "/conversation") {
      const limit = Number(url.searchParams.get("limit") ?? 20);
      return json(
        res,
        200,
        await requestFoundry("conversation", { limit })
      );
    }

    if (req.method === "GET" && url.pathname === "/events") {
      return json(res, 200, events);
    }

    if (req.method === "POST" && url.pathname === "/speak") {
      const body = await readJson(req);
      return json(
        res,
        200,
        await requestFoundry("speak", { text: body.text })
      );
    }

    if (req.method === "POST" && url.pathname === "/move") {
      const body = await readJson(req);
      return json(
        res,
        200,
        await requestFoundry("move", { x: body.x, y: body.y })
      );
    }

    return json(res, 404, {
      error: "Not found",
      routes: [
        "GET /status",
        "GET /snapshot",
        "GET /conversation",
        "GET /events",
        "POST /speak",
        "POST /move"
      ]
    });
  } catch (error) {
    return json(res, 500, {
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  const url = new URL(request.url ?? "/", `http://${HOST}:${PORT}`);

  if (url.pathname !== "/foundry") {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

wss.on("connection", (ws) => {
  if (foundrySocket && foundrySocket.readyState === WebSocket.OPEN) {
    foundrySocket.close(1012, "Replaced by a newer Foundry player client.");
  }

  foundrySocket = ws;
  hello = undefined;

  ws.on("message", handleFoundryMessage);

  ws.on("close", () => {
    if (foundrySocket === ws) {
      foundrySocket = undefined;
      hello = undefined;

      for (const [id, waiter] of pending) {
        waiter.reject(new Error("Foundry player client disconnected."));
        pending.delete(id);
      }
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`AI Pawn Phase 1 probe: http://${HOST}:${PORT}`);
  console.log(`Foundry WebSocket: ws://${HOST}:${PORT}/foundry`);
});
