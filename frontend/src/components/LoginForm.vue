<template>
  <div>
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
  </div>
</template>

<script>
  import utils from "../utils";

  export default {
    name: "LoginForm",
    data: function () {
      return {
        username: "",
        password: "",
      };
    },
    methods: {
      login: async function () {
        const user = await utils.fetch("login", {
          method: "POST",
          body: JSON.stringify({
            username: this.username,
            password: this.password,
          }),
        });

        this.password = null;
        this.$emit("update:user", user);
      },

      register: async function () {
        const user = await utils.fetch("register", {
          method: "POST",
          body: JSON.stringify({
            username: this.username,
            password: this.password,
          }),
        });

        this.password = null;
        this.$emit("update:user", user);
      },
    },
  };
</script>

<style scoped></style>
