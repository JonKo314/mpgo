<script setup>
  import { storeToRefs } from "pinia";
  import { useStore } from "../stores/game";
  import { useStore as useUserStore } from "../stores/user";
  import { useStore as usePlayerStore } from "../stores/player";
  import BoardView from "./BoardView.vue";
  import GameLobby from "./GameLobby.vue";
  import ColorIndicator from "./ColorIndicator.vue";

  const props = defineProps({
    gameId: String,
  });

  const store = useStore();
  store.update(props.gameId);
  const { turnEnd, timeLeft, turnCounter, started } = storeToRefs(store);

  const userStore = useUserStore();
  const { user } = storeToRefs(userStore);

  const playerStore = usePlayerStore();
  const { player } = storeToRefs(playerStore);
  playerStore.ready();

  const haltTurn = () => {
    store.haltTurn();
  };
  const endTurn = () => {
    store.endTurn();
  };
</script>

<template>
  <h3>Welcome to game {{ gameId }}</h3>
  <GameLobby v-if="!started" />
  <div v-if="started">
    <div v-if="player">
      Playing as
      <ColorIndicator
        v-bind:color="player.color"
        v-bind:secondaryColor="player.secondaryColor"
        size="25"
      />
    </div>
    <span v-if="turnEnd">Time left: {{ timeLeft }}</span>
    <span>Turn {{ turnCounter }}</span>
    <button v-if="user && user.isAdmin" type="button" v-on:click="haltTurn()">
      Halt turn
    </button>
    <button v-if="user && user.isAdmin" type="button" v-on:click="endTurn()">
      End turn
    </button>
  </div>
  <BoardView v-if="started" />
</template>
