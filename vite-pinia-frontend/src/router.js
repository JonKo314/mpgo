import { createRouter, createWebHistory } from "vue-router";
import MainView from "./components/MainView.vue";
import GameList from "./components/GameList.vue";
import GameInfo from "./components/GameInfo.vue";
import RegistrationForm from "./components/RegistrationForm.vue";
import InvitationList from "./components/InvitationList.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "index",
      redirect: "/main/games",
    },
    {
      path: "/main",
      name: "main",
      component: MainView,
      children: [
        { path: "games", name: "gameList", component: GameList },
        {
          path: "games/:gameId([0-9a-fA-F]+)",
          name: "game",
          component: GameInfo,
          props: true,
        },
      ],
    },
    {
      path: "/register/:invitation([0-9a-fA-F]+)",
      name: "registration",
      component: RegistrationForm,
      props: true,
    },
    {
      path: "/invitations",
      name: "invitations",
      component: InvitationList,
    },
  ],
});

export default router;
