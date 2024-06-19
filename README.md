:no_entry: [DISCONTINUED] Alternative approach at https://github.com/govariantsteam/govariants

I've built a prototype that allows to [play Parallel Multiplayer Go online](https://mpgo.westeurope.cloudapp.azure.com/) a [variant](https://en.wikipedia.org/wiki/Go_variants#Multi-player_Go) of the ancient game of [Go](https://en.wikipedia.org/wiki/Go_(game)) (aka Weiqi, Baduk).

**Basics**
* *Multiplayer*: It's possible to create games with more than two players. Each player is on their own and has a distinct color.
* *Parallel*: All players play one move per turn, they don't play in a certain sequence. E.g. each player has 1 minute to submit their move, after the minute is over the server puts all those moves on the board for everybody to see.
* *Collision Handling*: If multiple players submit the same move, additional rules are need to decide how to proceed. In the future I want to allow different rules which can be selected when a game is set up, but currently the rule goes roughly like this: The player whose previously placed stones are farther away from the stone-to-play gets to play the stone (more details further down).
* *Capturing Stones*: Capturing happens in two stages. First all chains without new stones and liberties are removed. Then all remaing chains without liberties are removed (similar to normal Go).
* *End of the game*: Currently games don't end, players can decide for themselves who has won. :sweat_smile:

**How to play**
* *Registration*: It is necessary to register a new user before one can join a game. Currently new users need to provide an invitation key to register. Only admins can create such keys at the moment.
* *Joining a game*: Currently only admins can create games. Users can request to join a game before it starts.
* *Placing stones*: Once a user joins a game, they become a player. Players can place one stone per turn by clicking on the board. A transparent stone will appear just for the player. Until a turn is done that stone can be removed by clicking it, after that a different stone can be placed.
* *Turns*: Each turn lasts a certain number of seconds, which can be set before the game starts. Admins can pause turns and end them early. Once a turn is over, the server decides which stones remain on the board and which are removed (according to the rules). After that all remainig stone are made visible.

**Colors**
* Players have primary colors and secondary colors. Primary colors are the colors of the players' stones, secondary colors are used to indicate recently placed stones. Users can choose default colors, which will be pre-selected when they join a new game. Once a game has started, the colors can't be changed anymore (except they can, but that's a bug).

**"Heat Based" Collision Handling**
* Colorized circles on the board indicate which players are privileged to play a certain move.
* "Heat" per player per position on the board is calculated like this:
Each stone (with coordinates (xStone, yStone)) the player successfully placed (i.e. not removed because of a collision) once on the board increases the player-specific heat of a position (x, y) by 0.5^(CurrentTurnNumber - TurnNumberStoneWasPlaced) / SquareRoot((x - xStone)² + (y - yStone)²)
* In case of a collision the stone of the player with the lowest heat at the position of the collision will be placed on the board. If two or more players share the lowest heat, no stone will be placed.
* Example: The following image shows a game from red's point of view. The indicator at the upper right 4-4-point shows the player-specific heats there are green < blue < yellow (starting at the top of the circle, going around clockwise). Thus red will only successfully place a stone there, if none of the other players tries to play there. The rings aren't helping much, I should get rid of them.
![Heat and privilege indicators|461x500](https://ogs-forums.s3.dualstack.us-east-1.amazonaws.com/original/3X/3/d/3d0545ef953403804838930175c71198694e159c.png)


**Password security**
* Passwords are stored using [Bcrypt (Wikipedia)](https://en.wikipedia.org/wiki/Bcrypt)
* I (and everyone who gains access to the virtual machine/server) can theoretically intercept passwords, so you shouldn't use a password that you don't want me (i.e. a random person on the internet) to read.
