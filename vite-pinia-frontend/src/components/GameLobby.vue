<script setup>
  import { storeToRefs } from "pinia";
  import { reactive } from "vue";
  import { useStore } from "../stores/game";
  import { useStore as usePlayerStore } from "../stores/player";
  import ColorIndicator from "./ColorIndicator.vue";

  const store = useStore();
  const { players } = storeToRefs(store);

  const playerStore = usePlayerStore();
  const { player } = storeToRefs(playerStore);
  playerStore.ready();

  const settings = reactive({ boardSize: null, turnTime: null });

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
      <input type="number" v-model="settings.boardSize" />
    </label>
    <label>
      <span>Turn time: </span>
      <input type="number" v-model="settings.turnTime" />
    </label>
    <button v-on:click="saveSettings()">Save settings</button>
  </div>
  <ul>
    <li v-for="somePlayer in players" v-bind:key="somePlayer._id">
      <span>{{ somePlayer._id }}</span>

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
  <button v-on:click="start()">Start</button>
</template>
