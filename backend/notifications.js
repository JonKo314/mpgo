const ws = require("ws");
const GameLogic = require("./gameLogic");

let instance = null;

module.exports = function (server) {
  instance = new Notifications(server);
};

// TODO: Test connection status (ping pong)
class Notifications {
  constructor(server) {
    this.wss = new ws.Server({ server });
    this.subscriptions = new Map();

    this.wss.on("connection", (socket) => this.handleConnection(socket));
  }

  handleConnection(socket) {
    try {
      socket.on("message", (message) => this.handleMessage(socket, message));
      socket.on("close", () => this.handleClose(socket));
    } catch (error) {
      console.warn(`Error while handling WebSockets:\n${error}`);
    }
  }

  handleMessage(socket, message) {
    try {
      const json = JSON.parse(message);
      if (json.action === "subscribeGame") {
        console.log(`Someone wants to subscribe to game ${json.id}`);
        this.subscribe(json.id, socket);
        socket.send(JSON.stringify({ ...json, ...{ done: true } }));
      } else if (json.action === "unsubscribeGame") {
        console.log(`Someone wants to unsubscribe from game ${json.id}`);
        this.unsubscribe(json.id, socket);
        socket.send(JSON.stringify({ ...json, ...{ done: true } }));
      } else if (json.action === "ping") {
        socket.send(
          JSON.stringify({
            ...json,
            ...{ action: "pong", pongTime: Date.now() },
          })
        );
      } else {
        console.log("received: %s", message);
        socket.send(`Server is unable to handle your message:\n${message}`);
      }
    } catch (error) {
      console.warn(`Error while handling WebSocket message:\n${error}`);
    }
  }

  handleClose(socket) {
    try {
      console.log(`Socket closed, unsubscribing from all games`);
      this.unsubscribeAll(socket);
    } catch (error) {
      console.warn(`Error while handling WebSocket close:\n${error}`);
    }
  }

  async subscribe(gameId, socket) {
    const callback = () =>
      socket.send(JSON.stringify({ action: "updateGame", id: gameId }));

    if (!this.subscriptions.has(socket)) {
      this.subscriptions.set(socket, new Map());
    }
    if (!this.subscriptions.get(socket).has(gameId)) {
      this.subscriptions.get(socket).set(gameId, callback);
      (await GameLogic.get(gameId)).subscribe(callback);
    }
  }

  async unsubscribe(gameId, socket) {
    if (
      this.subscriptions.has(socket) &&
      this.subscriptions.get(socket).has(gameId)
    ) {
      (await GameLogic.get(gameId)).unsubscribe(
        this.subscriptions.get(socket).get(gameId)
      );
      this.subscriptions.get(socket).delete(gameId);
    }
  }

  async unsubscribeAll(socket) {
    if (this.subscriptions.has(socket)) {
      this.subscriptions
        .get(socket)
        .forEach(async (callback, gameId) =>
          (await GameLogic.get(gameId)).unsubscribe(callback)
        );
      this.subscriptions.delete(socket);
    }
  }
}
