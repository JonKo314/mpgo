<script setup>
  const props = defineProps({
    color: String,
    secondaryColor: String,
    size: String,
  });
</script>

<template>
  <svg viewBox="-5 -5 10 10" v-bind:height="size" v-bind:width="size">
    <circle cx="0" cy="0" r="4.5" class="stone" v-bind:fill="color" />
    <circle
      cx="0"
      cy="0"
      r="2"
      class="newStoneMarker"
      v-bind:stroke="secondaryColor"
    />
  </svg>
</template>
