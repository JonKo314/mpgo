import { defineStore } from "pinia";
import { fetch } from "../utils";

export const useStore = defineStore("games", {
  state: () => {
    return { games: [], game: null };
  },
  actions: {
    async fetchGames() {
      this.games = await fetch("games/list");
    },

    async createGame(boardSize, turnTime) {
      this.games.push(
        await fetch("games", {
          method: "POST",
          body: JSON.stringify({
            boardSize: boardSize,
            turnTime: turnTime * 1000,
          }),
        })
      );
    },

    async setGame(gameId) {
      this.game = { _id: gameId }; // TODO
    },
  },
});
