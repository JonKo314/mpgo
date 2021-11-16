<script setup>
  import LoginForm from "./LoginForm.vue";
</script>

<template>
  <LoginForm />
  <router-view />
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
