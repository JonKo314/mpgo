<script setup>
  import { storeToRefs } from "pinia";
  import { ref } from "vue";
  import { useStore } from "../stores/user";
  import ColorIndicator from "./ColorIndicator.vue";

  const store = useStore();
  const { user } = storeToRefs(store);

  const changeColors = ref(false);
  const changedColor = ref("");
  const changedSecondaryColor = ref("");

  const initializeColors = () => {
    changedColor.value = store.user ? store.user.color : "";
    changedSecondaryColor.value = store.user ? store.user.secondaryColor : "";
  };

  const setColor = async () => {
    await store.setColor(changedColor.value, changedSecondaryColor.value);
    changeColors.value = false;
  };

  const cancelSetColor = () => {
    initializeColors();
    changeColors.value = false;
  };

  const logout = () => store.logout();

  store.$subscribe(initializeColors);
</script>

<template>
  <div v-if="user">
    <!-- TODO: Use player.name or change text -->
    <span>
      Logged in as {{ user.name }}
      <ColorIndicator
        v-bind:color="user.color"
        v-bind:secondaryColor="user.secondaryColor"
        size="25"
      />
    </span>
    <button type="button" v-on:click="changeColors = !changeColors">
      {{ changeColors ? 'Hide "Change colors"' : "Change colors" }}
    </button>
    <button type="button" v-on:click="logout()">Logout</button>

    <div v-if="changeColors">
      <label>
        <span>Primary Color:</span>
        <input type="color" v-model="changedColor" />
      </label>
      <label>
        <span>Secondary Color:</span>
        <input type="color" v-model="changedSecondaryColor" />
      </label>
      <br />
      <ColorIndicator
        v-bind:color="changedColor"
        v-bind:secondaryColor="changedSecondaryColor"
        size="50"
      />
      <button type="button" v-on:click="setColor()">Save</button>
      <button type="button" v-on:click="cancelSetColor()">Cancel</button>
    </div>
  </div>
</template>
