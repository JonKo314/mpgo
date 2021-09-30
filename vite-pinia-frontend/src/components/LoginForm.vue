<script setup>
  import { storeToRefs } from "pinia";
  import { ref } from "vue";
  import { useStore } from "../stores/user";

  const store = useStore();
  const { user } = storeToRefs(store);

  const username = ref("");
  const password = ref("");

  const clearCredentials = () => {
    username.value = "";
    password.value = "";
  };

  const login = () => {
    store.login(username.value, password.value);
    clearCredentials();
  };

  const register = () => {
    store.register(username.value, password.value);
    clearCredentials();
  };
</script>

<template>
  <div v-if="!user">
    <label>
      <span>Username:</span>
      <input type="text" v-model="username" />
    </label>
    <label>
      <span>Password:</span>
      <input type="password" v-model="password" />
    </label>
    <button type="button" v-on:click="login()">Login</button>
    <button type="button" v-on:click="register()">Register</button>
    <h3 v-if="user" v-bind:style="`color: ${user.color}`">
      Hi {{ user.name }}
    </h3>
  </div>
</template>
