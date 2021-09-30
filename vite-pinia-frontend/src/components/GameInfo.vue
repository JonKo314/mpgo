<script setup>
  import { storeToRefs } from "pinia";
  import { useStore } from "../stores/games";

  const store = useStore();
  const { game } = storeToRefs(store);
</script>

<template>
  <h3 v-if="game">Welcome to game {{ game._id }}</h3>
</template>
