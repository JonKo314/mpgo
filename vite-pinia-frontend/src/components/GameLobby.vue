<script setup>
  import { storeToRefs } from "pinia";
  import { reactive } from "vue";
  import { useStore } from "../stores/game";

  const store = useStore();
  const { players } = storeToRefs(store);

  const settings = reactive({ boardSize: null, turnTime: null });

  // TODO: Directly call store actions in template
  const saveSettings = () => {
    store.saveSettings(settings);
  };

  const join = () => {
    store.joinGame();
  };

  const start = () => {
    store.startGame();
  };
</script>

<template>
  <div>
    <label>
      <span>Board size: </span>
      <input type="number" v-model="settings.boardSize" />
    </label>
    <label>
      <span>Turn time: </span>
      <input type="number" v-model="settings.turnTime" />
    </label>
    <button v-on:click="saveSettings()">Save settings</button>
  </div>
  <ul>
    <li v-for="player in players" v-bind:key="player._id">
      {{ player._id }}
    </li>
  </ul>
  <button v-on:click="join()">Join</button>
  <button v-on:click="start()">Start</button>
</template>
