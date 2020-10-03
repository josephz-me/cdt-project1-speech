// https://www.youtube.com/watch?v=soerr09FYCw

var mic;
var sum_vol = 0,
  avg_vol = 0;
var w = 0;
let terrain = [];

//for socket
let terrains = [];
let terrainCount = 0;

let dict = {};
let lastTenWords = [];
let bg;
let capture;
let lastTenPositions = [];

var socket;
let player = new Object();
let players = [];
let id;
// let userImage;
let font;

//add ice breaker questions
let iceBreakers = [
  "Where are you from?",
  "What a hobby of yours?",
  "Tell us something you look forward to.",
  "What is your favorite thing to do by yourself?",
  "What is your idea of fun?",
];
let ibCount = 0;

function preload() {
  font = loadFont("DaysOne-Regular.ttf");
}

function setup() {
  // socket = io.connect("http://localhost:3000");
  socket = io.connect("https://cdt-speech-project.herokuapp.com/");

  textFont(font);
  textAlign(CENTER, CENTER);
  //welcome the user
  socket.on("welcome", (data) => {
    console.log("welcome user: " + data);
  });

  socket.on("heartbeatPlayers", function (data) {
    // console.log(data);
    players = data;
  });

  socket.on("heartbeatTerrain", function (data) {
    terrains = data;
  });

  socket.on("updateIBCount", function (data) {
    ibCount = data;
  });

  player = {
    x: 40,
    y: 90,
    speed: 3,
    dead: false,
    size: 30,
    color: "white",
  };
  socket.emit("start", player);

  let cnv = createCanvas(windowWidth, windowHeight);

  cnv.mousePressed(userStartAudio);
  mic = new p5.AudioIn();
  mic.start();

  //   fill("#00ff00");
  frameRate(60);
  noStroke();
  foo.start();
}

let foo = new p5.SpeechRec("en-US", showResult);
foo.onResult = showResult;
foo.continuous = true;
foo.interimResults = true;

function showResult() {
  if (frameCount % 4 === 0) {
    let vol = mic.getLevel();
    let words = foo.resultString.split(" ");

    let deletedWord;
    for (let i = 0; i < words.length; i++) {
      if (!(words[i] in dict)) {
        lastTenWords.push(words[i]);
      }
      if (lastTenWords.length > 10) {
        deletedWord = lastTenWords[0];
        lastTenWords.shift();
        delete dict[deletedWord];
      }

      if (!(words[i] in dict)) {
        let block = new Object();
        block = {
          id: socket.id,
          count: 0,
          x: random(width - 20, width),
          y: random(100, height),
          speed: map(random(10, 50), 10, 50, 0.5, 2),
          txt: words[i],
          volume: map(vol, 0.0001, 0.08, 14, 20),
          color: 30,
          colorCounter: 0,
        };

        //check if words will overlap when generated
        lastTenPositions.push(block.y);
        if (lastTenPositions.length > 10) {
          lastTenPositions.shift();
        }
        for (let i = 0; i < lastTenPositions; i++) {
          if (abs(block.y - lastTenPositions[i]) < 10) {
            block.y = random(20, height);
          }
        }
        block.count = terrainCount;
        terrainCount++;
        console.log(block.id);
        socket.emit("pushIntoTerrain", block);
      }
      dict[words[i]] = 1;
    }
  }
}

function draw() {
  background("black");
  fill(38, 38, 38);
  rect(width / 2, 0, width, 100);
  textSize(20);
  fill(187, 134, 252);
  text(iceBreakers[ibCount], width / 2, 20);

  //draws player on this screen
  // player.drawPlayer();

  //01 sends back player information
  socket.emit("update", player);

  //DRAW PLAYERS
  // draw other players
  let clientI;
  for (let i = 0; i < players.length; i++) {
    let id = players[i].id;
    if (id !== socket.id) {
      if (players[i].dead) {
        // if (this.size > 15) {
        //   this.size = this.size / 1.05;
        // }
        fill("red");
        textSize(30);
        text("X", players[i].x, players[i].y);
      } else {
        fill(players[i].color);
        // console.log(players[i].color);
        rect(players[i].x, players[i].y, players[i].size, players[i].size, 4);
      }
    } else {
      clientI = i;
    }
  }
  // if players[clientI] is valid
  if (players[clientI]) {
    player.color = players[clientI].color;
    //console.log("ClientI Color: " + players[clientI].color);
    // draw client player
    if (player.dead) {
      fill("red");
      textSize(30);
      text("X", player.x, player.y);
    } else {
      fill(player.color);
      rectMode(CENTER);
      rect(player.x, player.y, player.size, player.size, 4);
    }
  }

  //draw terrain
  if (terrains != null) {
    for (let i = 0; i < terrains.length; i++) {
      if (dist(player.x, player.y, terrains[i].x, terrains[i].y) < 15) {
        player.dead = true;
      }

      fill(terrains[i].color);
      textSize(terrains[i].volume);
      text(terrains[i].txt, terrains[i].x, terrains[i].y);
    }
  }

  if (!player.dead) {
    if (keyIsDown(LEFT_ARROW)) {
      if (player.x > player.size / 2) {
        player.x -= player.speed;
      }
    }
    if (keyIsDown(RIGHT_ARROW)) {
      if (player.x < width) {
        player.x += player.speed;
      }
    }

    if (keyIsDown(UP_ARROW)) {
      if (player.y > player.size / 2 + 50) {
        player.y -= player.speed;
      }
    }
    if (keyIsDown(DOWN_ARROW)) {
      if (player.y < height) {
        player.y += player.speed;
      }
    }
  }
}
