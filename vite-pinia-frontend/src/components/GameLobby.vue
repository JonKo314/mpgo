<script setup>
  import { storeToRefs } from "pinia";
  import { useStore } from "../stores/game";

  const store = useStore();
  const { players } = storeToRefs(store);

  const join = () => {
    store.joinGame();
  };

  const start = () => {
    store.startGame();
  };
</script>

<template>
  <ul>
    <li v-for="player in players" v-bind:key="player._id">
      {{ player._id }}
    </li>
  </ul>
  <button v-on:click="join()">Join</button>
  <button v-on:click="start()">Start</button>
</template>
