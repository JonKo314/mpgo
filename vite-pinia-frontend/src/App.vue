<script setup>
  import LoginForm from "./components/LoginForm.vue";
  import UserInfo from "./components/UserInfo.vue";
  import { useStore } from "./stores/user";
  import GameList from "./components/GameList.vue";
  import GameInfo from "./components/GameInfo.vue";

  useStore().checkLogin();
</script>

<template>
  <LoginForm />
  <UserInfo />
  <GameList />
  <GameInfo />
</template>

<style>
  line,
  circle {
    stroke-width: 0.2;
  }

  line {
    stroke: black;
  }

  circle.stone {
    stroke: black;
  }

  circle.stone.pending {
    fill-opacity: 0.5;
    stroke-opacity: 0.5;
  }

  circle.newStoneMarker {
    fill: none;
    stroke-width: 0.5;
  }

  circle.heatIndicator {
    stroke-width: 0.5;
    fill: none;
  }
</style>
