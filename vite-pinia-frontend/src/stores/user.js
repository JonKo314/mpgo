import { defineStore } from "pinia";
import { fetch } from "../utils";

export const useStore = defineStore("user", {
  state: () => {
    return { user: null };
  },

  actions: {
    async register(username, password, invitation) {
      this.user = await fetch("register", {
        method: "POST",
        body: JSON.stringify({ username, password, invitation }),
      });
    },

    async login(username, password) {
      this.user = await fetch("login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
    },

    async guestLogin() {
      this.user = await fetch("guestLogin", { method: "POST" });
      this.user.name = "guest";
    },

    async logout() {
      await fetch("logout");
      this.$reset();
    },

    async setColor(color, secondaryColor) {
      await fetch("setColors", {
        method: "POST",
        body: JSON.stringify({ color, secondaryColor }),
      });
      this.user.color = color;
      this.user.secondaryColor = secondaryColor;
    },

    async checkLogin() {
      this.user = await fetch("checkLogin");
    },
  },
});
