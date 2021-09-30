import { defineStore } from "pinia";
import { fetch } from "../utils";

// TODO: Should this even be a store or is this unnecessary overhead?
export const useStore = defineStore("games", {
  state: () => {
    return { games: [] };
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
  },
});
