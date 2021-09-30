<script setup>
  import { storeToRefs } from "pinia";
  import { ref } from "vue";
  import { useStore } from "../stores/user";

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
    <svg viewBox="-5 -5 10 10" height="50" width="50">
      <circle cx="0" cy="0" r="4.5" class="stone" v-bind:fill="user.color" />
      <circle
        cx="0"
        cy="0"
        r="2"
        class="newStoneMarker"
        v-bind:stroke="user.secondaryColor"
      />
    </svg>
  </div>
</template>
