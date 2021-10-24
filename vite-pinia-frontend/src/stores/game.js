import { defineStore } from "pinia";
import { fetch } from "../utils";
import { useStore as useSocketStore } from "./socket";

export const useStore = defineStore("game", {
  state: () => {
    return {
      gameId: "",
      boardSize: 0,
      turnTime: 0,
      turnCounter: 0,
      turnEnd: null,
      millisecondsLeft: Infinity,
      players: [],
      stones: [],
      started: false,
    };
  },

  actions: {
    update(gameId) {
      if (gameId && gameId !== this.gameId) {
        const socketStore = useSocketStore();
        if (this.gameId) {
          socketStore.unsubscribeGame(this.gameId, () => this.update());
        }
        socketStore.subscribeGame(gameId, () => this.update());

        this.$reset();
        this.gameId = gameId;
      }
      this.getGameState();
      this.getStones();
    },

    async getGameState() {
      const gameState = await fetch(`games/${this.gameId}/gameState`);
      gameState.turnEnd = new Date(gameState.turnEnd);

      delete gameState._id;
      delete gameState.__v;
      this.$patch(gameState);

      this.updateMillisecondsLeft();
    },

    async getStones() {
      this.stones = await fetch(`games/${this.gameId}/getStones`);
    },

    updateMillisecondsLeft() {
      const MAX_DATE = new Date(8640000000000000);
      this.millisecondsLeft =
        this.turnEnd < MAX_DATE ? this.turnEnd - new Date() : Infinity;
      if (this.millisecondsLeft <= 0 || this.millisecondsLeft === Infinity) {
        return;
      }

      const millisecondsUntilClockUpdate =
        this.millisecondsLeft > 6e5
          ? this.millisecondsLeft % 6e5
          : this.millisecondsLeft % 1e3;

      setTimeout(this.updateMillisecondsLeft, millisecondsUntilClockUpdate);
    },

    async saveSettings(settings) {
      await fetch(`games/${this.gameId}/settings`, {
        method: "POST",
        body: JSON.stringify(settings),
      });
    },

    async joinGame() {
      await fetch(`games/${this.gameId}/join`, { method: "POST" });
    },

    async startGame() {
      await fetch(`games/${this.gameId}/start`, { method: "POST" });
    },

    async haltTurn() {
      await fetch(`games/${this.gameId}/haltTurn`, { method: "POST" });
    },

    async endTurn() {
      await fetch(`games/${this.gameId}/endTurn`, { method: "POST" });
    },

    async addStone(x, y) {
      const stone = await fetch(`games/${this.gameId}/addStone`, {
        method: "POST",
        body: JSON.stringify({ x, y, isPending: true }),
      });
      this.stones.push(stone);
    },

    async removePendingStone(stone) {
      await fetch(`games/${this.gameId}/removePendingStone`, {
        method: "POST",
        body: JSON.stringify(stone),
      });

      this.stones.splice(this.stones.indexOf(stone), 1);
    },
  },

  getters: {
    timeLeft: (state) => {
      const twoDigits = (a) => a.toString().padStart(2, "0");
      const prettyTime = (a, b) => twoDigits(a) + ":" + twoDigits(b);

      if (state.millisecondsLeft === Infinity) {
        return "paused";
      }

      if (state.millisecondsLeft < 0) {
        return prettyTime(0, 0);
      }

      const hours = Math.floor(state.millisecondsLeft / 36e5);
      const minutes = Math.floor((state.millisecondsLeft % 36e5) / 6e4);
      const seconds = Math.floor((state.millisecondsLeft % 6e4) / 1e3);

      return hours > 0
        ? prettyTime(hours, minutes)
        : prettyTime(minutes, seconds);
    },

    // TODO: Deduplicate code, see gameLogic.js
    heatMaps: (state) => {
      const getDistance = (a, b) => {
        const dx2 = Math.pow(Math.abs(a.x - b.x), 2);
        const dy2 = Math.pow(Math.abs(a.y - b.y), 2);
        return Math.sqrt(dx2 + dy2);
      };

      const heatMaps = new Map(
        state.players.map((player) => [
          player._id,
          Array(state.boardSize)
            .fill()
            .map(() => Array(state.boardSize).fill(0)),
        ])
      );

      state.stones
        .filter((stone) => !stone.isPending && stone.removedBy !== "CONFLICT")
        .forEach((stone) => {
          for (let y = 0; y < state.boardSize; ++y) {
            for (let x = 0; x < state.boardSize; ++x) {
              const distance = Math.max(1.0, getDistance({ x, y }, stone));
              heatMaps.get(stone.player._id)[y][x] +=
                Math.pow(0.5, state.turnCounter - stone.placedOnTurn - 1) /
                distance;
            }
          }
        });

      return heatMaps;
    },
  },
});
