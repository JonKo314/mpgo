<script setup>
  import { storeToRefs } from "pinia";
  import { ref } from "vue";
  import { useStore } from "../stores/user";
  import router from "../router";

  const store = useStore();
  const { user } = storeToRefs(store);

  const username = ref("");
  const password = ref("");

  const props = defineProps({
    invitation: String,
  });

  const register = async () => {
    await store.register(username.value, password.value, props.invitation);
    router.push({ name: "index" });
  };
</script>

<template>
  <div v-if="user">Can't register, because you're already logged in.</div>
  <div v-else>
    <label>
      <span>Username:</span>
      <input type="text" v-model="username" />
    </label>
    <label>
      <span>Password:</span>
      <input type="password" v-model="password" />
    </label>
    <label>
      <span>Invitation key:</span>
      <input type="text" v-model="invitation" disabled />
    </label>
    <button type="button" v-on:click="register()">Register</button>
  </div>
</template>
