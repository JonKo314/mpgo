<template>
  <g>
    <circle
      v-if="showStone"
      v-bind:class="['stone', { pending: stone.isPending }]"
      v-bind:cx="10 * stone.x"
      v-bind:cy="10 * stone.y"
      v-bind:fill="stone.player.user.color"
      r="4.5"
      v-on:click="$emit('stone-click', stone)"
    />
    <circle
      v-if="showMarker"
      class="newStoneMarker"
      v-bind:cx="10 * stone.x"
      v-bind:cy="10 * stone.y"
      r="2"
      v-bind:stroke="markerColor"
    />
  </g>
</template>

<script>
  export default {
    name: "GoStone",
    props: {
      stone: Object,
      turnCounter: Number,
    },
    computed: {
      markerColor: ({ stone }) =>
        stone.removedOnTurn
          ? stone.player.user.color
          : stone.player.user.secondaryColor,
      showStone: ({ stone }) => !stone.removedOnTurn,
      showMarker: ({ stone, turnCounter }) =>
        turnCounter - stone.placedOnTurn === 1,
    },
  };
</script>

<style scoped></style>
