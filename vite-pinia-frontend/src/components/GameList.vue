<script setup>
  import { storeToRefs } from "pinia";
  import { reactive } from "vue";
  import { useStore } from "../stores/games";

  const store = useStore();
  const { game, games } = storeToRefs(store);

  const newGame = reactive({ boardSize: null, turnTime: null });

  const setGame = (gameId) => {
    store.setGame(gameId);
  };

  const createGame = () => {
    store.createGame(newGame.boardSize, newGame.turnTime);
  };

  store.fetchGames();
</script>

<template>
  <div v-if="!game">
    <p>Select game:</p>
    <ul>
      <li
        v-for="game in games"
        v-on:click="setGame(game._id)"
        v-bind:key="game._id"
      >
        {{ game._id }}
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
