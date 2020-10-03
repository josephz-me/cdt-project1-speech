let express = require("express");
let app = express();
// let server = app.listen(3000);
let server = app.listen(proccess.env.PORT);
let players = [];
let terrains = [];
let ibCount = 0;
let colorsAvailable = [
  [248, 203, 200],
  [249, 123, 106],
  [144, 169, 208],
  [3, 81, 132],
  [250, 221, 58],
  [150, 219, 222],
  [223, 72, 49],
  [178, 142, 106],
  [118, 196, 83],
];

let playerToColor = {};

function Players(id, x, y, speed, dead, size, color) {
  this.id = id;
  this.x = x;
  this.y = y;
  this.speed = speed;
  this.dead = dead;
  this.size = size;
  this.color = color;
}

app.use(express.static("public"));
let socket = require("socket.io");
let io = socket(server);

setInterval(function () {
  ibCount++;
  io.sockets.emit("updateIBCount", ibCount);
}, 30000);

io.sockets.on("connection", newConnection);

setInterval(function () {
  if (terrains.length !== 0) {
    moveTerrain();
  }
  io.sockets.emit("heartbeatPlayers", players);
  io.sockets.emit("heartbeatTerrain", terrains);
}, 33);

let socketId;
function moveTerrain() {
  for (i = 0; i < terrains.length; i++) {
    console.log(terrains[i].id, socketId);
    if (terrains[i].id === socketId) {
      terrains[i].color = playerToColor[terrains[i].id];
    }

    terrains[i].x -= terrains[i].speed;
    //remove elements when they exit the stage
    if (terrains[i].x < 0) {
      terrains.splice(i, 1);
    }
  }
}

function newConnection(socket) {
  socketId = socket.id;
  console.log("new connection " + socket.id);

  // when client just loads on
  socket.emit("welcome", socket.id);

  socket.on("start", function (data) {
    let random = Math.floor(Math.random() * colorsAvailable.length);
    // color = something
    let player = new Players(
      socket.id,
      data.x,
      data.y,
      data.speed,
      data.dead,
      data.size,
      colorsAvailable[random]
    );

    //console.log(random, colorsAvailable);
    data.color = player.color;

    players.push(player);
    playerToColor[player.id] = player.color;
    console.log(playerToColor[player.id]);
    // remove color from availableColors
    colorsAvailable.splice(random, 1);
    // If there are no availableColors, then throw an error ( > max players)
  });

  // 01 when client side emits
  socket.on("update", function (data) {
    let player;
    for (i = 0; i < players.length; i++) {
      if (socket.id === players[i].id) {
        player = players[i];
      }
    }

    if (player != null) {
      player.x = data.x;
      player.y = data.y;
      player.size = data.size;
      player.dead = data.dead;
    }
  });

  //if client disconnects
  socket.on("disconnect", function () {
    console.log("client " + socket.id + "has disconnected");
    for (i = 0; i < players.length; i++) {
      if (socket.id === players[i].id) {
        colorsAvailable.push(playerToColor[players[i].id]);
        players.splice(i, 1);
      }
    }
  });

  // —————————————————— TERRAIN —————————;—————————

  //only runs when a word is pushed
  socket.on("pushIntoTerrain", function (data) {
    terrains.push(data);
  });
}
