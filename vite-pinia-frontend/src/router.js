import { createRouter, createWebHistory } from "vue-router";
import GameList from "./components/GameList.vue";
import GameInfo from "./components/GameInfo.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "index", component: GameList },
    { path: "/games/", name: "gameList", component: GameList },
    {
      path: "/games/:gameId([0-9a-fA-F]+)",
      name: "game",
      component: GameInfo,
      props: true,
    },
  ],
});

export default router;
