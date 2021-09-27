<template>
  <div>
    <span>Playing as {{ value.name }}</span>
    <button type="button" v-on:click="logout()">Logout</button>
    <br />
    <label>
      <span>Primary Color:</span>
      <input type="color" v-model="value.color" v-on:change="setColor()" />
    </label>
    <label>
      <span>Secondary Color:</span>
      <input
        type="color"
        v-model="value.secondaryColor"
        v-on:change="setColor()"
      />
    </label>
    <br />
    <svg viewBox="-5 -5 10 10" height="50" width="50">
      <circle cx="0" cy="0" r="4.5" class="stone" v-bind:fill="value.color" />
      <circle
        cx="0"
        cy="0"
        r="2"
        class="newStoneMarker"
        v-bind:stroke="value.secondaryColor"
      />
    </svg>
  </div>
</template>

<script>
  import utils from "../utils";

  export default {
    name: "UserInfo",
    props: ["value"],
    methods: {
      logout: async function () {
        await utils.fetch("logout");
        this.value = null; // TODO: Doesn't propagate go parent?
        this.$emit("update:user", this.value);
      },

      setColor: async function () {
        await utils.fetch("setColors", {
          method: "POST",
          body: JSON.stringify({
            color: this.value.color,
            secondaryColor: this.value.secondaryColor,
          }),
        });
      },
    },
  };
</script>

<style scoped></style>
