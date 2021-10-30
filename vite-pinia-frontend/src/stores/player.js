import { defineStore } from "pinia";
import { fetch } from "../utils";
import { useStore as useUserStore } from "./user";
import { useStore as useGameStore } from "./game";

export const useStore = defineStore("player", {
  state: () => {
    return {
      gameId: "",
      userId: "",
      player: null,
      isReady: false,
    };
  },

  actions: {
    // This needs to be called before the store can be used
    // TODO: Run automatically after store is created
    ready() {
      if (this.isReady) {
        return;
      }

      this.isReady = true;
      const userStore = useUserStore();
      const gameStore = useGameStore();
      this.userId = userStore.user?._id ?? "";
      this.gameId = gameStore.gameId;

      // TODO: Fix unknown player after joining game (neither game nor user did change)
      userStore.$subscribe((mutation, state) => {
        const userId = state.user?._id ?? "";
        if (this.userId !== userId) {
          this.userId = userId;
          this.update();
        }
      });
      gameStore.$subscribe((mutation, state) => {
        if (this.gameId !== state.gameId) {
          this.gameId = state.gameId;
          this.update();
        }
      });

      this.update();
    },

    async update() {
      if (this.userId === "" || this.gameId === "") {
        this.player = null;
        return;
      }

      this.player = await fetch(`games/${this.gameId}/player`);
    },

    async saveColors() {
      await fetch(`games/${this.gameId}/colors`, {
        method: "POST",
        body: JSON.stringify({
          color: this.player.color,
          secondaryColor: this.player.secondaryColor,
        }),
      });
    },
  },
});
