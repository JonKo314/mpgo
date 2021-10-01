<script setup>
  import { computed } from "vue";
  import { useStore } from "../stores/game";
  import { SVG_FACTOR } from "../utils";
  import TilePrivilegeIndicator from "./TilePrivilegeIndicator.vue";

  const store = useStore();

  const tiles = computed(() => {
    const tiles = [];
    const rows = store.boardSize;
    const columns = store.boardSize;
    for (let row = 0; row < rows; ++row) {
      for (let column = 0; column < columns; ++column) {
        tiles.push({
          x: column * SVG_FACTOR,
          y: row * SVG_FACTOR,
          north: row > 0,
          east: column < columns - 1,
          south: row < rows - 1,
          west: column > 0,
        });
      }
    }
    return tiles;
  });

  const tileClick = (tile) => {
    store.addStone(tile.x / SVG_FACTOR, tile.y / SVG_FACTOR);
  };
</script>

<template>
  <g>
    <g v-for="tile in tiles" v-bind:key="`(${tile.x}, ${tile.y})`">
      <line
        stroke-linecap="square"
        v-bind:x1="tile.x"
        v-bind:y1="tile.y"
        v-bind:x2="tile.x"
        v-bind:y2="tile.y"
      />
      <line
        v-if="tile.north"
        v-bind:x1="tile.x"
        v-bind:y1="tile.y"
        v-bind:x2="tile.x"
        v-bind:y2="tile.y - 0.5 * SVG_FACTOR"
      />
      <line
        v-if="tile.east"
        v-bind:x1="tile.x"
        v-bind:y1="tile.y"
        v-bind:x2="tile.x + 0.5 * SVG_FACTOR"
        v-bind:y2="tile.y"
      />
      <line
        v-if="tile.south"
        v-bind:x1="tile.x"
        v-bind:y1="tile.y"
        v-bind:x2="tile.x"
        v-bind:y2="tile.y + 0.5 * SVG_FACTOR"
      />
      <line
        v-if="tile.west"
        v-bind:x1="tile.x"
        v-bind:y1="tile.y"
        v-bind:x2="tile.x - 0.5 * SVG_FACTOR"
        v-bind:y2="tile.y"
      />
      <TilePrivilegeIndicator v-bind:tile="tile" />
      <circle
        v-bind:cx="tile.x"
        v-bind:cy="tile.y"
        v-bind:r="0.4 * SVG_FACTOR"
        fill-opacity="0"
        v-on:click="tileClick(tile)"
      />
    </g>
  </g>
</template>
