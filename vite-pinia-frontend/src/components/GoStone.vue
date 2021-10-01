<script setup>
  import { computed } from "vue";
  import { storeToRefs } from "pinia";
  import { useStore } from "../stores/game";
  import { SVG_FACTOR } from "../utils";

  const props = defineProps({
    stone: Object,
  });

  const store = useStore();
  const { turnCounter } = storeToRefs(store);

  const markerColor = computed(() =>
    props.stone.removedOnTurn
      ? props.stone.player.user.color
      : props.stone.player.user.secondaryColor
  );
  const showStone = computed(() => !props.stone.removedOnTurn);
  const showMarker = computed(
    () => turnCounter.value - props.stone.placedOnTurn === 1
  );

  const stoneClick = async () => {
    if (!props.stone.isPending) {
      return;
    }
    store.removePendingStone(props.stone);
  };
</script>

<template>
  <g>
    <circle
      v-if="showStone"
      v-bind:class="['stone', { pending: stone.isPending }]"
      v-bind:cx="SVG_FACTOR * stone.x"
      v-bind:cy="SVG_FACTOR * stone.y"
      v-bind:fill="stone.player.user.color"
      v-bind:r="0.45 * SVG_FACTOR"
      v-on:click="stoneClick()"
    />
    <circle
      v-if="showMarker"
      class="newStoneMarker"
      v-bind:cx="SVG_FACTOR * stone.x"
      v-bind:cy="SVG_FACTOR * stone.y"
      v-bind:r="0.2 * SVG_FACTOR"
      v-bind:stroke="markerColor"
    />
  </g>
</template>
