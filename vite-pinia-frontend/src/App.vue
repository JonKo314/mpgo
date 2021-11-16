<script setup>
  import UserInfo from "./components/UserInfo.vue";
  import { useStore } from "./stores/user";

  useStore().checkLogin();
</script>

<template>
  <UserInfo />
  <router-view />
</template>
