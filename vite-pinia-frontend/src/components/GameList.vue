<script setup>
  import { storeToRefs } from "pinia";
  import { useStore } from "../stores/games";
  import { useStore as useUserStore } from "../stores/user";

  const store = useStore();
  const { games } = storeToRefs(store);

  const userStore = useUserStore();
  const { user } = storeToRefs(userStore);

  const createGame = () => {
    store.createGame();
  };

  store.fetchGames();
</script>

<template>
  <div>
    <button v-if="user && user.isAdmin" type="button" v-on:click="createGame()">
      New game
    </button>
    <p>Select game:</p>
    <ul>
      <li v-for="game in games" v-bind:key="game._id">
        <router-link v-bind:to="{ name: 'game', params: { gameId: game._id } }">
          {{ game._id }}
        </router-link>
      </li>
    </ul>
  </div>
</template>
