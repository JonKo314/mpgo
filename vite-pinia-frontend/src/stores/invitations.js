import { defineStore } from "pinia";
import { fetch } from "../utils";

export const useStore = defineStore("invitations", {
  state: () => {
    return { invitations: [] };
  },

  actions: {
    async fetchInvitations() {
      this.invitations = await fetch("invitations");
    },

    async createInvitation() {
      this.invitations.push(
        await fetch("invitations/create", {
          method: "POST",
        })
      );
    },
  },
});
