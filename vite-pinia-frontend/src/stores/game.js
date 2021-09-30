import { defineStore } from "pinia";
import { fetch } from "../utils";

export const useStore = defineStore("game", {
  state: () => {
    return {
      gameId: "",
      boardSize: 0,
      turnTime: 0,
      turnCounter: 0,
      turnEnd: null,
      players: [],
      millisecondsLeft: Infinity,
      stones: [],
    };
  },
  actions: {
    update(gameId) {
      if (gameId) {
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
      if (this.millisecondsLeft !== Infinity) {
        setTimeout(this.update, this.millisecondsLeft);
      }
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

    async haltTurn() {
      await fetch(`games/${this.gameId}/haltTurn`, { method: "POST" });
      this.getGameState();
    },

    async endTurn() {
      await fetch(`games/${this.gameId}/endTurn`, { method: "POST" });
      this.update();
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
  },
});
