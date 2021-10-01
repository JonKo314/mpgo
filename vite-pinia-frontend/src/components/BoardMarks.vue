<script setup>
  import { computed } from "vue";
  import { useStore } from "../stores/game";
  import { SVG_FACTOR } from "../utils";

  const store = useStore();

  const marks = computed(() => {
    const marks = [];
    const left = { x: SVG_FACTOR * (store.boardSize < 13 ? 2 : 3) };
    const right = { x: SVG_FACTOR * (store.boardSize - 1) - left.x };
    const top = { y: left.x };
    const bottom = { y: right.x };

    marks.push({ ...left, ...top });
    marks.push({ ...right, ...top });
    marks.push({ ...left, ...bottom });
    marks.push({ ...right, ...bottom });

    if (store.boardSize % 2 > 0) {
      const mid = SVG_FACTOR * 0.5 * (store.boardSize - 1);
      const midRow = { y: mid };
      const midColumn = { x: mid };
      marks.push({ ...midRow, ...midColumn });

      if (store.boardSize >= 15) {
        marks.push({ ...left, ...midRow });
        marks.push({ ...right, ...midRow });
        marks.push({ ...midColumn, ...top });
        marks.push({ ...midColumn, ...bottom });
      }
    }
    return marks;
  });
</script>

<template>
  <g>
    <circle
      v-for="mark in marks"
      v-bind:key="`(${mark.x}, ${mark.y})`"
      v-bind:cx="mark.x"
      v-bind:cy="mark.y"
      v-bind:r="0.1 * SVG_FACTOR"
    />
  </g>
</template>
