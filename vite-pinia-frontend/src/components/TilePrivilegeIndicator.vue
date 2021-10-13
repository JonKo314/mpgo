<script setup>
  import { storeToRefs } from "pinia";
  import { computed } from "vue";
  import { useStore } from "../stores/game";
  import { useStore as useUserStore } from "../stores/user";
  import { SVG_FACTOR } from "../utils";

  const props = defineProps({
    tile: Object,
  });

  const store = useStore();
  const { players } = storeToRefs(store);
  const userStore = useUserStore();

  const _x = computed(() => props.tile.x / SVG_FACTOR);
  const _y = computed(() => props.tile.y / SVG_FACTOR);

  const playerHeats = computed(() => {
    const map = new Map();
    store.players.forEach((player) => {
      map.set(
        player.user.name,
        store.heatMaps.get(player.user.name)[_y.value][_x.value]
      );
    });
    return map;
  });

  const playerHeat = computed(() =>
    !userStore.user ? 0 : playerHeats.value.get(userStore.user.name)
  );
  const subjectivePrivilegedPlayers = computed(() =>
    !userStore.user
      ? []
      : store.players
          .filter(
            (player) =>
              player.user.name !== userStore.user.name &&
              playerHeats.value.get(player.user.name) <= playerHeat.value
          )
          .sort(
            (firstPlayer, secondPlayer) =>
              playerHeats.value.get(firstPlayer.user.name) -
              playerHeats.value.get(secondPlayer.user.name)
          )
  );

  const subjectivePrivilegePlayerPaths = computed(() => {
    const playerPaths = [];
    const players = subjectivePrivilegedPlayers.value;
    const x = _x.value;
    const y = _y.value;

    const r = 0.2 * SVG_FACTOR;
    if (players.length === 1) {
      const path = `
        M ${x * SVG_FACTOR + r} ${y * SVG_FACTOR}
        A ${r} ${r} 0 0 0 ${x * SVG_FACTOR - r} ${y * SVG_FACTOR}
        A ${r} ${r} 0 0 0 ${x * SVG_FACTOR + r} ${y * SVG_FACTOR}`;
      playerPaths.push([players[0], path]);
      return playerPaths;
    }

    for (
      let playerCounter = 0;
      playerCounter < players.length;
      ++playerCounter
    ) {
      const startAngle =
        Math.PI * (0.5 - (2.0 * playerCounter) / players.length);
      const endAngle =
        Math.PI * (0.5 - (2.0 * (playerCounter + 1)) / players.length);
      const startX = x * SVG_FACTOR + r * Math.cos(startAngle);
      const startY = y * SVG_FACTOR - r * Math.sin(startAngle);
      const endX = x * SVG_FACTOR + r * Math.cos(endAngle);
      const endY = y * SVG_FACTOR - r * Math.sin(endAngle);
      const largeArcFlag = Math.abs(startAngle - endAngle) > Math.PI ? 1 : 0;
      const path = `
                  M ${startX} ${startY}
                  A ${r} ${r} 0 ${largeArcFlag} 1 ${endX} ${endY}
                  L ${x * SVG_FACTOR} ${y * SVG_FACTOR}
                  Z`;
      playerPaths.push([players[playerCounter], path]);
    }
    return playerPaths;
  });
</script>

<template>
  <g>
    <circle
      class="heatIndicator"
      v-for="player in players"
      v-bind:key="player.user.name"
      v-bind:cx="tile.x"
      v-bind:cy="tile.y"
      v-bind:stroke="player.color"
      v-bind:stroke-opacity="playerHeats.get(player.user.name) * 0.9"
      v-bind:r="0.28 * SVG_FACTOR"
    />
    <path
      v-for="[player, path] in subjectivePrivilegePlayerPaths"
      v-bind:key="player.user.name"
      v-bind:d="path"
      v-bind:fill="player.color"
      fill-opacity="0.8"
    />
  </g>
</template>
