<script setup>
  import { storeToRefs } from "pinia";
  import { reactive } from "vue";
  import { useStore } from "../stores/games";

  const store = useStore();
  const { games } = storeToRefs(store);

  const newGame = reactive({ boardSize: null, turnTime: null });

  const createGame = () => {
    store.createGame(newGame.boardSize, newGame.turnTime);
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
    <label>
      <span>Board size: </span>
      <input type="number" v-model="newGame.boardSize" />
    </label>
    <label>
      <span>Turn time: </span>
      <input type="number" v-model="newGame.turnTime" />
    </label>
    <button type="button" v-on:click="createGame()">New game</button>
  </div>
</template>
