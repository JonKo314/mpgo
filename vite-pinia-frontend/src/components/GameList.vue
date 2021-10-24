<script setup>
  import { storeToRefs } from "pinia";
  import { useStore } from "../stores/games";

  const store = useStore();
  const { games } = storeToRefs(store);

  const createGame = () => {
    store.createGame();
  };

  store.fetchGames();
</script>

<template>
  <div>
    <p>Select game:</p>
    <ul>
      <li v-for="game in games" v-bind:key="game._id">
        <router-link v-bind:to="{ name: 'game', params: { gameId: game._id } }">
          {{ game._id }}
        </router-link>
      </li>
    </ul>
    <button type="button" v-on:click="createGame()">New game</button>
  </div>
</template>
