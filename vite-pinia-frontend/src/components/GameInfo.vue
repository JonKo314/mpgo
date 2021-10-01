<script setup>
  import { storeToRefs } from "pinia";
  import { useStore } from "../stores/game";
  import { useStore as useUserStore } from "../stores/user";
  import BoardView from "./BoardView.vue";

  const props = defineProps({
    gameId: String,
  });

  const store = useStore();
  store.update(props.gameId);
  const { turnEnd, timeLeft, turnCounter } = storeToRefs(store);

  const userStore = useUserStore();
  const { user } = storeToRefs(userStore);

  const haltTurn = () => {
    store.haltTurn();
  };
  const endTurn = () => {
    store.endTurn();
  };
</script>

<template>
  <div>
    <h3>Welcome to game {{ gameId }}</h3>
    <span v-if="turnEnd">Time left: {{ timeLeft }}</span>
    <span>Turn {{ turnCounter }}</span>
    <button v-if="user" type="button" v-on:click="haltTurn()">Halt turn</button>
    <button v-if="user" type="button" v-on:click="endTurn()">End turn</button>
  </div>
  <BoardView />
</template>
