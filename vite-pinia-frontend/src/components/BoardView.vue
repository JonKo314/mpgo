<script setup>
  import { computed } from "vue";
  import { storeToRefs } from "pinia";
  import { useStore } from "../stores/game";
  import { SVG_FACTOR } from "../utils";
  import BoardTiles from "./BoardTiles.vue";
  import BoardMarks from "./BoardMarks.vue";
  import GoStone from "./GoStone.vue";

  const store = useStore();
  const { stones, boardSize } = storeToRefs(store);

  const viewBox = computed(() => {
    const viewBoxStart = -SVG_FACTOR;
    const viewBoxSize = SVG_FACTOR * (boardSize.value + 1);
    return `${viewBoxStart} ${viewBoxStart} ${viewBoxSize} ${viewBoxSize}`;
  });
</script>

<template>
  <svg v-bind:view-box.camel="viewBox" height="600" width="600">
    <BoardMarks />
    <BoardTiles />
    <g>
      <GoStone
        v-for="stone in stones"
        v-bind:key="stone._id"
        v-bind:stone="stone"
        v-on:stone-click="stoneClick(stone)"
      />
    </g>
  </svg>
</template>
