<script setup>
  import { storeToRefs } from "pinia";
  import { useStore } from "../stores/invitations";
  import { useStore as useUserStore } from "../stores/user";
  import router from "../router";

  const store = useStore();
  const { invitations } = storeToRefs(store);

  const userStore = useUserStore();
  const { user } = storeToRefs(userStore);

  store.fetchInvitations();

  const getRegistrationLocation = (invitation) => {
    return {
      name: "registration",
      params: { invitation: invitation._id },
    };
  };

  const copyInvitationLinkToClipboard = (invitation) => {
    navigator.clipboard.writeText(
      window.location.origin +
        router.resolve(getRegistrationLocation(invitation)).href
    );
  };
</script>

<template>
  <div v-if="!user || !user.isAdmin">Forbidden</div>
  <div v-else>
    <table>
      <tr>
        <th colspan="2">Key</th>
        <th>Creator</th>
        <th>Created at</th>
        <th>User</th>
        <th>Used at</th>
      </tr>

      <tr v-for="invitation in invitations">
        <td>
          <router-link v-bind:to="getRegistrationLocation(invitation)">
            {{ invitation._id }}
          </router-link>
        </td>

        <td>
          <button
            type="button"
            v-on:click="copyInvitationLinkToClipboard(invitation)"
          >
            Copy
          </button>
        </td>

        <td>{{ invitation.creator.name }}</td>
        <td>{{ invitation.createdAt }}</td>
        <td>{{ invitation.user?.name }}</td>
        <td>{{ invitation.usedAt }}</td>
      </tr>
    </table>

    <button type="button" v-on:click="store.createInvitation()">
      Create invitation
    </button>
  </div>
</template>

<style scoped>
  td {
    min-width: 50px;
    padding: 0 5px;
  }
</style>
