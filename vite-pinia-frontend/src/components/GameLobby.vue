<script setup>
  import { storeToRefs } from "pinia";
  import { reactive } from "vue";
  import { useStore } from "../stores/game";
  import { useStore as usePlayerStore } from "../stores/player";
  import { useStore as useUserStore } from "../stores/user";
  import ColorIndicator from "./ColorIndicator.vue";

  const store = useStore();
  const { players } = storeToRefs(store);

  const settings = reactive({
    boardSize: store.boardSize,
    turnTime: store.turnTime ? store.turnTime / 1000 : null,
  });

  store.$subscribe((mutation, state) => {
    settings.boardSize = state.boardSize;
    settings.turnTime = state.turnTime ? state.turnTime / 1000 : null;
  });

  const playerStore = usePlayerStore();
  const { player } = storeToRefs(playerStore);
  playerStore.ready();

  const userStore = useUserStore();
  const { user } = storeToRefs(userStore);

  // TODO: Directly call store actions in template
  const saveSettings = () => {
    store.saveSettings(settings);
  };

  const join = () => {
    playerStore.joinGame();
  };

  const start = () => {
    store.startGame();
  };

  const saveColors = () => {
    playerStore.saveColors();
  };
</script>

<template>
  <div>
    <label>
      <span>Board size: </span>
      <input
        type="number"
        v-model="settings.boardSize"
        v-bind:disabled="!user || !user.isAdmin"
      />
    </label>
    <label>
      <span>Turn time: </span>
      <input
        type="number"
        v-model="settings.turnTime"
        v-bind:disabled="!user || !user.isAdmin"
      />
    </label>
    <button v-if="user && user.isAdmin" v-on:click="saveSettings()">
      Save settings
    </button>
  </div>
  <ul>
    <li
      v-for="somePlayer in players"
      v-bind:key="somePlayer._id"
      v-bind:class="{ unconfirmedPlayer: !somePlayer.confirmedByAdmin }"
    >
      <span v-if="user && user.isAdmin">
        <button
          v-if="!somePlayer.confirmedByAdmin"
          type="button"
          v-on:click="store.confirmPlayer(somePlayer)"
        >
          Confirm
        </button>
        <button v-else type="button" v-on:click="store.kickPlayer(somePlayer)">
          Kick
        </button>
      </span>

      <span class="playerName">{{ somePlayer._id }}</span>
      <span v-if="somePlayer.userKind === 'GuestUser'">(guest)</span>

      <ColorIndicator
        v-bind:color="somePlayer.color"
        v-bind:secondaryColor="somePlayer.secondaryColor"
        size="25"
      />
      <div v-if="player?._id === somePlayer._id">
        <ColorIndicator
          v-bind:color="player.color"
          v-bind:secondaryColor="player.secondaryColor"
          size="40"
        />
        <input type="color" v-model="player.color" />
        <input type="color" v-model="player.secondaryColor" />
        <button v-on:click="saveColors()">Save colors</button>
      </div>
    </li>
  </ul>
  <button v-on:click="join()">Join</button>
  <button v-if="user && user.isAdmin" v-on:click="start()">Start</button>
</template>

<style scoped>
  .unconfirmedPlayer .playerName {
    color: gray;
  }
</style>
