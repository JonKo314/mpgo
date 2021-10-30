<script setup>
  import { storeToRefs } from "pinia";
  import { ref } from "vue";
  import { useStore } from "../stores/user";
  import ColorIndicator from "./ColorIndicator.vue";

  const store = useStore();
  const { user } = storeToRefs(store);

  const changedColor = ref("");
  const changedSecondaryColor = ref("");

  store.$subscribe((mutation, state) => {
    changedColor.value = state.user ? state.user.color : "";
    changedSecondaryColor.value = state.user ? state.user.secondaryColor : "";
  });

  const setColor = () =>
    store.setColor(changedColor.value, changedSecondaryColor.value);
  const logout = () => store.logout();
</script>

<template>
  <div v-if="user">
    <!-- TODO: Use player.name or change text -->
    <span>Playing as {{ user.name }}</span>
    <button type="button" v-on:click="logout()">Logout</button>
    <br />
    <label>
      <span>Primary Color:</span>
      <input type="color" v-model="changedColor" v-on:change="setColor()" />
    </label>
    <label>
      <span>Secondary Color:</span>
      <input
        type="color"
        v-model="changedSecondaryColor"
        v-on:change="setColor()"
      />
    </label>
    <br />
    <ColorIndicator
      v-bind:color="user.color"
      v-bind:secondaryColor="user.secondaryColor"
      size="50"
    />
  </div>
</template>
