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

    async createGame() {
      const game = await fetch("games", {
        method: "POST",
        body: JSON.stringify({}),
      });
      this.games.push(game);
      return game;
    },
  },
});
