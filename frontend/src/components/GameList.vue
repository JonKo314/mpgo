<template>
  <div>
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

<script>
  import utils from "../utils";

  export default {
    name: "GameList",
    props: ["games"],
    data: function () {
      return {
        newGame: { boardSize: null, turnTime: null },
      };
    },
    methods: {
      setGame: function (gameId) {
        this.$emit("update:gameId", gameId);
      },

      createGame: async function () {
        // TODO: Input validation
        this.games.push(
          await utils.fetch("games", {
            method: "POST",
            body: JSON.stringify({
              boardSize: this.newGame.boardSize,
              turnTime: this.newGame.turnTime * 1000,
            }),
          })
        );
      },
    },
  };
</script>

<style scoped></style>
