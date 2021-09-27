<template>
  <div id="app">
    <LoginForm v-if="!user" v-bind:user.sync="user" />
    <UserInfo v-if="user" v-model="user" v-bind:user.sync="user" />

    <div v-if="!gameId">
      <p>Select game:</p>
      <ul>
        <li
          v-for="game in games"
          v-on:click="setGame(game._id)"
          v-bind:key="game._id"
        >
          {{ game._id }}
        </li>
      </ul>
      <label>
        <span>Board size: </span>
        <input type="number" v-model="newGame.boardSize" />
      </label>
      <label>
        <span>Turn time: </span>
        <input type="number" v-model="newGame.turnTime" />
      </label>
      <button type="button" v-on:click="createGame()">New game</button>
    </div>

    <div v-if="gameId">
      <div>
        <p>{{ message }}</p>
        <span v-if="turnEnd">Time left: {{ timeLeft }}</span>
        <span>Turn {{ turnCounter }}</span>
        <button v-if="user" type="button" v-on:click="haltTurn()">
          Halt turn
        </button>
        <button v-if="user" type="button" v-on:click="endTurn()">
          End turn
        </button>
      </div>
      <svg v-bind:view-box.camel="board.viewBox" height="600" width="600">
        <circle
          v-for="mark in board.marks"
          v-bind:key="`(${mark.x}, ${mark.y})`"
          v-bind:cx="mark.x"
          v-bind:cy="mark.y"
          r="1"
        />
        <g v-for="tile in board.tiles" v-bind:key="`(${tile.x}, ${tile.y})`">
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
            v-bind:y2="tile.y - 5"
          />
          <line
            v-if="tile.east"
            v-bind:x1="tile.x"
            v-bind:y1="tile.y"
            v-bind:x2="tile.x + 5"
            v-bind:y2="tile.y"
          />
          <line
            v-if="tile.south"
            v-bind:x1="tile.x"
            v-bind:y1="tile.y"
            v-bind:x2="tile.x"
            v-bind:y2="tile.y + 5"
          />
          <line
            v-if="tile.west"
            v-bind:x1="tile.x"
            v-bind:y1="tile.y"
            v-bind:x2="tile.x - 5"
            v-bind:y2="tile.y"
          />
          <circle
            class="heatIndicator"
            v-for="user in users"
            v-bind:key="user.name"
            v-bind:cx="tile.x"
            v-bind:cy="tile.y"
            v-bind:stroke="user.color"
            v-bind:stroke-opacity="
              heatMaps.get(user.name)[tile.y / 10][tile.x / 10] * 0.9
            "
            r="2.8"
          />
          <path
            v-for="([user, path], index) in subjectivePrivilegePathMap[
              tile.y / 10
            ][tile.x / 10]"
            v-bind:key="index"
            v-bind:d="path"
            v-bind:fill="user.color"
            fill-opacity="0.8"
          />
          <circle
            v-bind:cx="tile.x"
            v-bind:cy="tile.y"
            r="4"
            fill-opacity="0"
            v-on:click="tileClick(tile)"
          />
        </g>
        <g v-for="stone in stones" v-bind:key="stone._id">
          <GoStone
            v-bind:stone="stone"
            v-bind:turn-counter="turnCounter"
            v-on:stone-click="stoneClick(stone)"
          />
        </g>
      </svg>
    </div>
  </div>
</template>

<script>
  import utils from "./utils";
  import LoginForm from "./components/LoginForm.vue";
  import UserInfo from "./components/UserInfo.vue";
  import GoStone from "./components/GoStone.vue";

  export default {
    name: "App",
    components: {
      LoginForm,
      UserInfo,
      GoStone,
    },
    data: function () {
      return {
        message: "Welcome to parallel multiplayer Go!",
        username: "",
        password: "",
        user: null,
        games: [],
        gameId: null,
        stones: [],
        boardSize: null,
        turnCounter: 0,
        turnEnd: null,
        millisecondsLeft: Infinity,
        clockTimeout: null,
        newGame: { boardSize: null, turnTime: null },
      };
    },

    computed: {
      // TODO: Get users directly from game object
      users: function () {
        const usernames = new Set(
          this.stones.map((stone) => stone.player.user.name)
        );

        return [...usernames].map(
          (name) =>
            this.stones.find((stone) => stone.player.user.name === name).player
              .user
        );
      },

      timeLeft: function () {
        const twoDigits = (a) => a.toString().padStart(2, "0");
        const prettyTime = (a, b) => twoDigits(a) + ":" + twoDigits(b);

        if (this.millisecondsLeft === Infinity) {
          return "paused";
        }

        if (this.millisecondsLeft < 0) {
          return prettyTime(0, 0);
        }

        const hours = Math.floor(this.millisecondsLeft / 36e5);
        const minutes = Math.floor((this.millisecondsLeft % 36e5) / 6e4);
        const seconds = Math.floor((this.millisecondsLeft % 6e4) / 1e3);

        return hours > 0
          ? prettyTime(hours, minutes)
          : prettyTime(minutes, seconds);
      },

      board: function () {
        const board = {};
        const svgFactor = 10;

        const tiles = [];
        const rows = this.boardSize;
        const columns = this.boardSize;
        for (let row = 0; row < rows; ++row) {
          for (let column = 0; column < columns; ++column) {
            tiles.push({
              x: column * svgFactor,
              y: row * svgFactor,
              north: row > 0,
              east: column < columns - 1,
              south: row < rows - 1,
              west: column > 0,
            });
          }
        }

        const marks = [];
        const left = { x: svgFactor * (this.boardSize < 13 ? 2 : 3) };
        const right = { x: svgFactor * (this.boardSize - 1) - left.x };
        const top = { y: left.x };
        const bottom = { y: right.x };

        marks.push({ ...left, ...top });
        marks.push({ ...right, ...top });
        marks.push({ ...left, ...bottom });
        marks.push({ ...right, ...bottom });

        if (this.boardSize % 2 > 0) {
          const mid = svgFactor * 0.5 * (this.boardSize - 1);
          const midRow = { y: mid };
          const midColumn = { x: mid };
          marks.push({ ...midRow, ...midColumn });

          if (this.boardSize >= 15) {
            marks.push({ ...left, ...midRow });
            marks.push({ ...right, ...midRow });
            marks.push({ ...midColumn, ...top });
            marks.push({ ...midColumn, ...bottom });
          }
        }

        const viewBoxStart = -svgFactor;
        const viewBoxSize = svgFactor * (this.boardSize + 1);

        board.tiles = tiles;
        board.marks = marks;
        board.viewBox = `${viewBoxStart} ${viewBoxStart} ${viewBoxSize} ${viewBoxSize}`;

        return board;
      },

      // TODO: Deduplicate code, see gameLogic.js
      heatMaps: function () {
        const getDistance = (a, b) => {
          const dx2 = Math.pow(Math.abs(a.x - b.x), 2);
          const dy2 = Math.pow(Math.abs(a.y - b.y), 2);
          return Math.sqrt(dx2 + dy2);
        };

        const heatMaps = new Map(
          this.users.map((user) => [
            user.name,
            Array(this.boardSize)
              .fill()
              .map(() => Array(this.boardSize).fill(0)),
          ])
        );

        this.stones
          .filter((stone) => !stone.isPending && stone.removedBy !== "CONFLICT")
          .forEach((stone) => {
            for (let y = 0; y < this.boardSize; ++y) {
              for (let x = 0; x < this.boardSize; ++x) {
                const distance = Math.max(1.0, getDistance({ x, y }, stone));
                heatMaps.get(stone.player.user.name)[y][x] +=
                  Math.pow(0.5, this.turnCounter - stone.placedOnTurn - 1) /
                  distance;
              }
            }
          });

        return heatMaps;
      },

      objectivePrivilegeMap: function () {
        if (!this.users.length) {
          return Array(this.boardSize)
            .fill()
            .map(() => Array(this.boardSize).fill([]));
        }

        const privilegeMap = [];
        for (let y = 0; y < this.boardSize; ++y) {
          privilegeMap[y] = [];
          for (let x = 0; x < this.boardSize; ++x) {
            const [privilegedUsers] = this.users
              .map((user) => [[user], this.heatMaps.get(user.name)[y][x]])
              .reduce(([minUsers, minHeat], [[user], heat]) =>
                heat < minHeat
                  ? [[user], heat]
                  : heat === minHeat
                  ? [[...minUsers, user], heat]
                  : [minUsers, minHeat]
              );
            privilegeMap[y][x] = privilegedUsers;
          }
        }
        return privilegeMap;
      },

      subjectivePrivilegeMap: function () {
        if (!this.user || !this.heatMaps.has(this.user.name)) {
          return Array(this.boardSize)
            .fill()
            .map(() => Array(this.boardSize).fill([]));
        }

        const privilegeMap = [];
        for (let y = 0; y < this.boardSize; ++y) {
          privilegeMap[y] = [];
          for (let x = 0; x < this.boardSize; ++x) {
            const userHeat = this.heatMaps.get(this.user.name)[y][x];
            const privilegedUsers = this.users
              .filter(
                (user) =>
                  user.name !== this.user.name &&
                  this.heatMaps.get(user.name)[y][x] <= userHeat
              )
              .sort(
                (firstUser, secondUser) =>
                  this.heatMaps.get(secondUser.name)[y][x] -
                  this.heatMaps.get(firstUser.name)[y][x]
              );
            privilegeMap[y][x] = privilegedUsers;
          }
        }
        return privilegeMap;
      },

      subjectivePrivilegePathMap: function () {
        const pathMap = [];
        for (let y = 0; y < this.boardSize; ++y) {
          pathMap[y] = [];
          for (let x = 0; x < this.boardSize; ++x) {
            pathMap[y][x] = [];
            const users = this.subjectivePrivilegeMap[y][x];

            const r = 2;
            if (users.length === 1) {
              const path = `
                  M ${x * 10 + r} ${y * 10}
                  A ${r} ${r} 0 0 0 ${x * 10 - r} ${y * 10}
                  A ${r} ${r} 0 0 0 ${x * 10 + r} ${y * 10}`;
              pathMap[y][x].push([users[0], path]);
              continue;
            }

            for (
              let userCounter = 0;
              userCounter < users.length;
              ++userCounter
            ) {
              const startAngle =
                Math.PI * (0.5 - (2.0 * userCounter) / users.length);
              const endAngle =
                Math.PI * (0.5 - (2.0 * (userCounter + 1)) / users.length);
              const startX = x * 10 + r * Math.cos(startAngle);
              const startY = y * 10 - r * Math.sin(startAngle);
              const endX = x * 10 + r * Math.cos(endAngle);
              const endY = y * 10 - r * Math.sin(endAngle);
              const largeArcFlag =
                Math.abs(startAngle - endAngle) > Math.PI ? 1 : 0;
              const path = `
                  M ${startX} ${startY}
                  A ${r} ${r} 0 ${largeArcFlag} 1 ${endX} ${endY}
                  L ${x * 10} ${y * 10}
                  Z`;
              pathMap[y][x].push([users[userCounter], path]);
            }
          }
        }

        console.log(pathMap);
        return pathMap;
      },
    },

    created: function () {
      if (this.game) {
        this.update();
      } else {
        this.getGames();
      }
      this.checkLogin();
    },

    methods: {
      setGame: function (id) {
        this.gameId = id;
        this.update();
      },

      getGames: async function () {
        this.games = await utils.fetch("games/list");
      },

      createGame: async function () {
        this.games.push(
          await utils.fetch("games", {
            method: "POST",
            body: JSON.stringify({
              boardSize: this.newGame.boardSize,
              turnTime: this.newGame.turnTime * 1000,
            }),
          })
        );
      },

      haltTurn: async function () {
        await utils.fetch(`games/${this.gameId}/haltTurn`, { method: "POST" });
        this.getGameSate();
      },

      endTurn: async function () {
        await utils.fetch(`games/${this.gameId}/endTurn`, { method: "POST" });
        this.update();
      },

      update: function () {
        this.getGameSate();
        this.getStones();
      },

      getGameSate: async function () {
        const gameState = await utils.fetch(`games/${this.gameId}/gameState`);
        this.boardSize = gameState.boardSize;
        this.turnCounter = gameState.turnCounter;
        this.turnEnd = new Date(gameState.turnEnd);

        this.updateTurnClock();
        if (this.millisecondsLeft !== Infinity) {
          setTimeout(this.update, this.millisecondsLeft);
        }
      },

      getStones: async function () {
        this.stones = await utils.fetch(`games/${this.gameId}/getStones`);
      },

      tileClick: async function (tile) {
        const stone = await utils.fetch(`games/${this.gameId}/addStone`, {
          method: "POST",
          body: JSON.stringify({
            x: tile.x / 10,
            y: tile.y / 10,
            isPending: true,
          }),
        });
        this.stones.push(stone);
      },

      stoneClick: async function (stone) {
        if (!stone.isPending) {
          return;
        }

        await utils.fetch(`games/${this.gameId}/removePendingStone`, {
          method: "POST",
          body: JSON.stringify(stone),
        });

        this.stones.splice(this.stones.indexOf(stone), 1);
      },

      updateTurnClock: function () {
        const MAX_DATE = new Date(8640000000000000);
        this.millisecondsLeft =
          this.turnEnd < MAX_DATE ? this.turnEnd - new Date() : Infinity;
        if (this.millisecondsLeft <= 0 || this.millisecondsLeft === Infinity) {
          return;
        }

        const millisecondsUntilClockUpdate =
          this.millisecondsLeft > 6e5
            ? this.millisecondsLeft % 6e5
            : this.millisecondsLeft % 1e3;

        this.clockTimeout = setTimeout(
          this.updateTurnClock,
          millisecondsUntilClockUpdate
        );
      },

      checkLogin: async function () {
        this.user = await utils.fetch("checkLogin");
      },
    },
  };
</script>

<style>
  line,
  circle {
    stroke-width: 0.2;
  }

  line {
    stroke: black;
  }

  circle.stone {
    stroke: black;
  }

  circle.stone.pending {
    fill-opacity: 0.5;
    stroke-opacity: 0.5;
  }

  circle.newStoneMarker {
    fill: none;
    stroke-width: 0.5;
  }

  circle.heatIndicator {
    stroke-width: 0.5;
    fill: none;
  }
</style>
