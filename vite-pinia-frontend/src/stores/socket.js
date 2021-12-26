import { defineStore } from "pinia";

export const useStore = defineStore("socket", {
  state: () => {
    return {
      socket: null,
      connected: false,
      gameSubscriptions: new Map(),
      queue: [],
    };
  },

  actions: {
    ready() {
      if (this.socket) {
        return this.connected;
      }

      // TODO: Which WebSocket URL if not running in development mode on localhost?
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const socket = new WebSocket(`${protocol}://${window.location.host}/ws/`);
      socket.onopen = () => {
        this.connected = true;
        this.sendQueue();
      };
      socket.onerror = (error) => console.warn(error);
      socket.onmessage = (message) => this.handleMessage(message);
      socket.onclose = (event) => {
        console.warn(event);
        // TODO: Consider circumstances and decide, if recovery is desired
        // Hot reload of server: Recovery desired (event.wasClean = false)
        if (!event.wasClean) {
          this.recover();
        }
      };
      this.socket = socket;
      return false;
    },

    recover() {
      const remainingGameSubscriptions = this.gameSubscriptions;
      this.$reset();
      remainingGameSubscriptions.forEach((callbacks, gameId) =>
        callbacks.forEach((callback) => this.subscribeGame(gameId, callback))
      );
    },

    send(message) {
      if (this.ready()) {
        this.socket.send(message);
      } else {
        this.queue.push(message);
      }
    },

    sendQueue() {
      this.queue.forEach((message) => this.socket.send(message));
      this.queue.length = 0;
    },

    handleMessage(message) {
      try {
        const json = JSON.parse(message.data);
        if (
          json.action === "updateGame" &&
          this.gameSubscriptions.has(json.id)
        ) {
          this.gameSubscriptions.get(json.id).forEach((callback) => callback());
        } else {
          console.log(`Unhandled json from socket:`);
          console.log(json);
        }
      } catch (error) {
        console.warn(`Unable to parse WebSocket message due to: ${error}`);
        console.warn("Message was:");
        console.warn(message);
      }
    },

    subscribeGame(gameId, callback) {
      if (!this.gameSubscriptions.has(gameId)) {
        this.gameSubscriptions.set(gameId, new Set());
        this.send(JSON.stringify({ action: "subscribeGame", id: gameId }));
      }
      this.gameSubscriptions.get(gameId).add(callback);
    },

    unsubscribeGame(gameId, callback) {
      if (this.gameSubscriptions.has(gameId)) {
        this.gameSubscriptions.get(gameId).delete(callback);
        if (!this.gameSubscriptions.get(gameId).size) {
          this.send(JSON.stringify({ action: "unsubscribeGame", id: gameId }));
          this.gameSubscriptions.delete(gameId);
        }
      }
    },
  },
});
